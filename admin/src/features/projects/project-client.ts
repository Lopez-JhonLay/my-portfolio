import { adminRequest } from "../../lib/admin-http.ts";
import {
  PROJECT_CATEGORIES,
  type AdminProject,
  type DraftOperation,
  type FeaturedDraft,
  type PublicationOperation,
  type ProjectDraft,
  type ProjectGallery,
  type ProjectList,
  type SaveResult,
  type SaveFeaturedResult,
} from "./project-contract.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]) {
  return Object.keys(value).every((key) => keys.includes(key));
}

function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isPositiveIntegerString(value: unknown): value is string {
  return typeof value === "string" && /^[1-9][0-9]*$/.test(value);
}

function parseProjectDraft(value: unknown): ProjectDraft {
  if (!isRecord(value)) throw new Error("Invalid Project draft response");
  const allowedKeys = [
    "number",
    "name",
    "category",
    "description",
    "role",
    "tech",
    "repo",
    "liveUrl",
    "slug",
    "longDescriptionMarkdown",
    "groupOrder",
  ];
  const requiredStrings = ["number", "name", "description", "slug"];
  if (
    !hasOnlyKeys(value, allowedKeys) ||
    requiredStrings.some((key) => typeof value[key] !== "string") ||
    !PROJECT_CATEGORIES.includes(
      value.category as (typeof PROJECT_CATEGORIES)[number],
    ) ||
    !Array.isArray(value.tech) ||
    !value.tech.every((technology) => typeof technology === "string") ||
    !Number.isInteger(value.groupOrder) ||
    (value.groupOrder as number) <= 0
  ) {
    throw new Error("Invalid Project draft response");
  }
  for (const field of ["role", "repo", "liveUrl", "longDescriptionMarkdown"]) {
    if (value[field] !== undefined && typeof value[field] !== "string")
      throw new Error("Invalid Project draft response");
  }

  return value as ProjectDraft;
}

function parseProjectGallery(value: unknown): ProjectGallery {
  if (!Array.isArray(value) || value.length > 5) {
    throw new Error("Invalid Project gallery response");
  }
  const gallery = value.map((item) => {
    if (
      !isRecord(item) ||
      !hasOnlyKeys(item, ["mediaId", "altText", "isCover"]) ||
      !isUuid(item.mediaId) ||
      typeof item.altText !== "string" ||
      typeof item.isCover !== "boolean"
    ) {
      throw new Error("Invalid Project gallery response");
    }
    return {
      mediaId: item.mediaId,
      altText: item.altText,
      isCover: item.isCover,
    };
  });
  if (
    new Set(gallery.map(({ mediaId }) => mediaId)).size !== gallery.length ||
    (gallery.length > 0 &&
      gallery.filter(({ isCover }) => isCover).length !== 1)
  ) {
    throw new Error("Invalid Project gallery response");
  }
  return gallery;
}

export function parseAdminProject(value: unknown): AdminProject {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, [
      "id",
      "lifecycle",
      "publicationIntent",
      "revision",
      "draft",
      "gallery",
    ]) ||
    !isUuid(value.id) ||
    (value.lifecycle !== "active" && value.lifecycle !== "trashed") ||
    (value.publicationIntent !== "include" &&
      value.publicationIntent !== "exclude") ||
    !isPositiveIntegerString(value.revision)
  ) {
    throw new Error("Invalid Project response");
  }
  return {
    id: value.id,
    lifecycle: value.lifecycle,
    publicationIntent: value.publicationIntent,
    revision: value.revision,
    draft: parseProjectDraft(value.draft),
    gallery: parseProjectGallery(value.gallery ?? []),
  };
}

function parseOperation(value: unknown): DraftOperation {
  if (
    !isRecord(value) ||
    !isUuid(value.operationId) ||
    (value.kind !== "save_project_draft" &&
      value.kind !== "save_featured_draft") ||
    !(value.projectId === null || isUuid(value.projectId))
  ) {
    throw new Error("Invalid operation response");
  }
  if (
    value.status === "pending" &&
    hasOnlyKeys(value, ["operationId", "kind", "projectId", "status"])
  ) {
    return {
      operationId: value.operationId,
      kind: value.kind,
      projectId: value.projectId,
      status: "pending",
    };
  }
  const outcomes = [
    "project_draft_created",
    "project_draft_saved",
    "featured_draft_saved",
    "stale_revision",
    "invalid_featured_reference",
    "invalid_gallery_reference",
  ] as const;
  if (
    (value.status === "succeeded" || value.status === "failed") &&
    outcomes.includes(value.outcomeCode as (typeof outcomes)[number]) &&
    isPositiveIntegerString(value.resultRevision) &&
    hasOnlyKeys(value, [
      "operationId",
      "kind",
      "projectId",
      "status",
      "outcomeCode",
      "resultRevision",
    ])
  ) {
    return value as DraftOperation;
  }
  throw new Error("Invalid operation response");
}

export function parsePublicationOperation(
  value: unknown,
): PublicationOperation {
  if (
    !isRecord(value) ||
    !isUuid(value.operationId) ||
    value.kind !== "publish"
  ) {
    throw new Error("Invalid publication operation response");
  }
  if (
    value.status === "pending" &&
    hasOnlyKeys(value, ["operationId", "kind", "status"])
  ) {
    return {
      operationId: value.operationId,
      kind: "publish",
      status: "pending",
    };
  }
  if (
    value.status === "succeeded" &&
    value.outcomeCode === "published" &&
    isPositiveIntegerString(value.snapshotRevision) &&
    hasOnlyKeys(value, [
      "operationId",
      "kind",
      "status",
      "outcomeCode",
      "snapshotRevision",
    ])
  ) {
    return {
      operationId: value.operationId,
      kind: "publish",
      status: "succeeded",
      outcomeCode: "published",
      snapshotRevision: value.snapshotRevision,
    };
  }
  if (
    value.status === "failed" &&
    value.outcomeCode === "publish_not_ready" &&
    hasOnlyKeys(value, ["operationId", "kind", "status", "outcomeCode"])
  ) {
    return {
      operationId: value.operationId,
      kind: "publish",
      status: "failed",
      outcomeCode: "publish_not_ready",
    };
  }
  throw new Error("Invalid publication operation response");
}

function parseSaveResult(value: unknown): SaveResult {
  try {
    return parseAdminProject(value);
  } catch {
    return parseOperation(value);
  }
}

function parseProjectList(value: unknown): ProjectList {
  if (!isRecord(value)) throw new Error("Invalid Project list response");
  const pagination = value.pagination;
  if (
    !hasOnlyKeys(value, ["projects", "pagination"]) ||
    !Array.isArray(value.projects) ||
    !isRecord(pagination) ||
    !hasOnlyKeys(pagination, [
      "page",
      "pageSize",
      "totalItems",
      "totalPages",
    ]) ||
    !["page", "pageSize", "totalItems", "totalPages"].every((key) =>
      Number.isInteger(pagination[key]),
    )
  ) {
    throw new Error("Invalid Project list response");
  }
  return {
    projects: value.projects.map(parseAdminProject),
    pagination: {
      page: pagination.page as number,
      pageSize: pagination.pageSize as number,
      totalItems: pagination.totalItems as number,
      totalPages: pagination.totalPages as number,
    },
  };
}

export function parseFeaturedDraft(value: unknown): FeaturedDraft {
  if (
    !isRecord(value) ||
    !hasOnlyKeys(value, ["revision", "slots"]) ||
    !isPositiveIntegerString(value.revision) ||
    !Array.isArray(value.slots) ||
    value.slots.length !== 3 ||
    !value.slots.every((projectId) => projectId === null || isUuid(projectId))
  ) {
    throw new Error("Invalid featured draft response");
  }
  return {
    revision: value.revision,
    slots: [
      value.slots[0] ?? null,
      value.slots[1] ?? null,
      value.slots[2] ?? null,
    ],
  };
}

function parseSaveFeaturedResult(value: unknown): SaveFeaturedResult {
  try {
    return parseFeaturedDraft(value);
  } catch {
    return parseOperation(value);
  }
}

export function parseAuthoritativeProject(value: unknown): AdminProject | null {
  if (!isRecord(value) || !isRecord(value.authoritative)) return null;
  try {
    return parseAdminProject(value.authoritative);
  } catch {
    return null;
  }
}

export function parseAuthoritativeFeatured(
  value: unknown,
): FeaturedDraft | null {
  if (!isRecord(value) || !("authoritative" in value)) return null;
  try {
    return parseFeaturedDraft(value.authoritative);
  } catch {
    return null;
  }
}

export function createProjectClient(apiOrigin: string) {
  return {
    list: async (signal?: AbortSignal) =>
      parseProjectList(
        await adminRequest(
          apiOrigin,
          "/api/admin/projects?page=1&pageSize=100",
          {
            signal,
          },
        ),
      ),
    read: async (projectId: string, signal?: AbortSignal) =>
      parseAdminProject(
        await adminRequest(apiOrigin, `/api/admin/projects/${projectId}`, {
          signal,
        }),
      ),
    readFeatured: async (signal?: AbortSignal) =>
      parseFeaturedDraft(
        await adminRequest(apiOrigin, "/api/admin/project-featured", {
          signal,
        }),
      ),
    create: async (
      operationId: string,
      csrfToken: string,
      draft: ProjectDraft,
      gallery: ProjectGallery = [],
      signal?: AbortSignal,
    ) =>
      parseSaveResult(
        await adminRequest(apiOrigin, "/api/admin/projects", {
          body: { draft, gallery },
          csrfToken,
          method: "POST",
          operationId,
          signal,
        }),
      ),
    save: async (
      projectId: string,
      operationId: string,
      csrfToken: string,
      expectedRevision: string,
      draft: ProjectDraft,
      gallery: ProjectGallery,
      signal?: AbortSignal,
    ) =>
      parseSaveResult(
        await adminRequest(
          apiOrigin,
          `/api/admin/projects/${projectId}/draft`,
          {
            body: { draft, expectedRevision, gallery },
            csrfToken,
            method: "PUT",
            operationId,
            signal,
          },
        ),
      ),
    saveFeatured: async (
      operationId: string,
      csrfToken: string,
      expectedRevision: string,
      slots: FeaturedDraft["slots"],
      signal?: AbortSignal,
    ) =>
      parseSaveFeaturedResult(
        await adminRequest(apiOrigin, "/api/admin/project-featured", {
          body: { expectedRevision, slots },
          csrfToken,
          method: "PUT",
          operationId,
          signal,
        }),
      ),
    readOperation: async (operationId: string, signal?: AbortSignal) =>
      parseOperation(
        await adminRequest(
          apiOrigin,
          `/api/admin/project-operations/${operationId}`,
          { signal },
        ),
      ),
    publish: async (
      operationId: string,
      csrfToken: string,
      signal?: AbortSignal,
    ) =>
      parsePublicationOperation(
        await adminRequest(apiOrigin, "/api/admin/project-publications", {
          body: {},
          csrfToken,
          method: "POST",
          operationId,
          signal,
        }),
      ),
    readPublication: async (operationId: string, signal?: AbortSignal) =>
      parsePublicationOperation(
        await adminRequest(
          apiOrigin,
          `/api/admin/project-publications/${operationId}`,
          { signal },
        ),
      ),
  };
}

export type ProjectClient = ReturnType<typeof createProjectClient>;
