const DEFAULT_API_ORIGIN = "http://127.0.0.1:3000";
const PROJECT_CATEGORIES = [
  "Personal Project",
  "Work Project",
  "Capstone Project",
];
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export class PublicProjectsError extends Error {
  constructor(message) {
    super(message);
    this.name = "PublicProjectsError";
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value, allowedKeys) {
  return Object.keys(value).every((key) => allowedKeys.includes(key));
}

function isNonBlankString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isHttpUrl(value) {
  if (typeof value !== "string" || !URL.canParse(value)) return false;
  const url = new URL(value);
  return url.protocol === "http:" || url.protocol === "https:";
}

function isProjectSlug(value) {
  return (
    typeof value === "string" &&
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)
  );
}

function isMediaReference(value) {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ["mediaId", "altText"]) &&
    typeof value.mediaId === "string" &&
    UUID_PATTERN.test(value.mediaId) &&
    isNonBlankString(value.altText)
  );
}

function isProjectCard(value) {
  if (!isRecord(value)) return false;
  if (
    !hasOnlyKeys(value, [
      "number",
      "name",
      "category",
      "description",
      "role",
      "tech",
      "repo",
      "liveUrl",
      "slug",
      "cover",
    ]) ||
    !isNonBlankString(value.number) ||
    !isNonBlankString(value.name) ||
    !PROJECT_CATEGORIES.includes(value.category) ||
    !isNonBlankString(value.description) ||
    !isProjectSlug(value.slug) ||
    !Array.isArray(value.tech) ||
    value.tech.length === 0 ||
    !value.tech.every(isNonBlankString)
  ) {
    return false;
  }

  return (
    (value.role === undefined || isNonBlankString(value.role)) &&
    (value.repo === undefined || isHttpUrl(value.repo)) &&
    (value.liveUrl === undefined || isHttpUrl(value.liveUrl))
    && (value.cover === undefined || isMediaReference(value.cover))
  );
}

function withMediaUrls(project, apiOrigin) {
  const mediaUrl = (mediaId) => `${apiOrigin}/api/media/${mediaId}`;
  return {
    ...project,
    tech: [...project.tech],
    ...(project.cover === undefined
      ? {}
      : { cover: { ...project.cover, url: mediaUrl(project.cover.mediaId) } }),
    ...(project.gallery === undefined
      ? {}
      : {
          gallery: project.gallery.map((image) => ({
            ...image,
            url: mediaUrl(image.mediaId),
          })),
        }),
  };
}

function parseStatus(value) {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["status"]) ||
    (value.status !== "never-published" && value.status !== "published")
  ) {
    throw new PublicProjectsError(
      "The Projects service returned an unexpected response.",
    );
  }
  return value.status;
}

function parseFeatured(value, apiOrigin) {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["projects"]) ||
    !Array.isArray(value.projects) ||
    value.projects.length !== 3 ||
    !value.projects.every(isProjectCard) ||
    new Set(value.projects.map(({ slug }) => slug)).size !== 3
  ) {
    throw new PublicProjectsError(
      "The Projects service returned an unexpected response.",
    );
  }
  return value.projects.map((project) => withMediaUrls(project, apiOrigin));
}

function parseGroups(value, apiOrigin) {
  if (
    !Array.isArray(value) ||
    value.length !== PROJECT_CATEGORIES.length ||
    !value.every(
      (group, index) =>
        isRecord(group) &&
        hasOnlyKeys(group, ["category", "projects"]) &&
        group.category === PROJECT_CATEGORIES[index] &&
        Array.isArray(group.projects) &&
        group.projects.every(
          (project) =>
            isProjectCard(project) && project.category === group.category,
        ),
    )
  ) {
    throw new PublicProjectsError(
      "The Projects service returned an unexpected response.",
    );
  }

  return value.map((group) => ({
    category: group.category,
    projects: group.projects.map((project) =>
      withMediaUrls(project, apiOrigin),
    ),
  }));
}

function parseDetail(value, apiOrigin) {
  const cardValue = isRecord(value)
    ? Object.fromEntries(
        Object.entries(value).filter(
          ([key]) => key !== "longDescriptionMarkdown" && key !== "gallery",
        ),
      )
    : value;
  if (
    !isProjectCard(cardValue) ||
    !hasOnlyKeys(value, [
      "number",
      "name",
      "category",
      "description",
      "role",
      "tech",
      "repo",
      "liveUrl",
      "slug",
      "cover",
      "longDescriptionMarkdown",
      "gallery",
    ]) ||
    (value.longDescriptionMarkdown !== undefined &&
      !isNonBlankString(value.longDescriptionMarkdown)) ||
    !Array.isArray(value.gallery) ||
    value.gallery.length > 5 ||
    !value.gallery.every(isMediaReference)
  ) {
    throw new PublicProjectsError(
      "The Projects service returned an unexpected response.",
    );
  }
  return withMediaUrls(value, apiOrigin);
}

async function readJson(fetchImpl, url, signal) {
  const response = await fetchImpl(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
    method: "GET",
    signal,
  });

  if (!response.ok) {
    throw new PublicProjectsError("Projects could not be loaded.");
  }

  try {
    return await response.json();
  } catch {
    throw new PublicProjectsError(
      "The Projects service returned an unexpected response.",
    );
  }
}

export function readPublicApiOrigin(
  configuredValue = DEFAULT_API_ORIGIN,
) {
  const configured =
    typeof configuredValue === "string" && configuredValue.length > 0
      ? configuredValue
      : DEFAULT_API_ORIGIN;
  const url = new URL(configured);

  if (
    url.origin !== configured ||
    url.username.length > 0 ||
    url.password.length > 0 ||
    (url.protocol !== "http:" && url.protocol !== "https:")
  ) {
    throw new Error(
      "VITE_PUBLIC_API_ORIGIN must be an HTTP(S) origin without credentials.",
    );
  }
  return url.origin;
}

export async function loadPublicProjects({
  apiOrigin,
  fetchImpl = fetch,
  resource,
  signal,
  staticProjects,
  timeoutMs = 30_000,
}) {
  const controller = new AbortController();
  const abortFromCaller = () => controller.abort(signal?.reason);

  if (signal?.aborted) abortFromCaller();
  signal?.addEventListener("abort", abortFromCaller, { once: true });
  const timeout = setTimeout(
    () =>
      controller.abort(
        new DOMException("The Projects request timed out.", "TimeoutError"),
      ),
    timeoutMs,
  );

  try {
    const status = parseStatus(
      await readJson(
        fetchImpl,
        `${apiOrigin}/api/projects/status`,
        controller.signal,
      ),
    );
    if (status === "never-published") return structuredClone(staticProjects);

    const path = resource === "featured" ? "/featured" : "";
    const value = await readJson(
      fetchImpl,
      `${apiOrigin}/api/projects${path}`,
      controller.signal,
    );
    return resource === "featured"
      ? parseFeatured(value, apiOrigin)
      : parseGroups(value, apiOrigin);
  } catch (error) {
    if (controller.signal.reason?.name === "TimeoutError") {
      throw new PublicProjectsError(
        "The Projects request timed out. Please try again.",
      );
    }
    if (signal?.aborted) throw signal.reason ?? error;
    if (error instanceof PublicProjectsError) throw error;
    throw new PublicProjectsError("Projects could not be loaded.");
  } finally {
    clearTimeout(timeout);
    signal?.removeEventListener("abort", abortFromCaller);
  }
}

export async function loadPublicProjectDetail({
  apiOrigin,
  fetchImpl = fetch,
  signal,
  slug,
  staticProject,
}) {
  const status = parseStatus(
    await readJson(fetchImpl, `${apiOrigin}/api/projects/status`, signal),
  );
  if (status === "never-published") {
    if (staticProject === undefined) {
      throw new PublicProjectsError("Project not found.");
    }
    return { ...structuredClone(staticProject), gallery: [] };
  }
  return parseDetail(
    await readJson(
      fetchImpl,
      `${apiOrigin}/api/projects/${encodeURIComponent(slug)}`,
      signal,
    ),
    apiOrigin,
  );
}
