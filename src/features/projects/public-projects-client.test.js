import assert from "node:assert/strict";
import test from "node:test";

import {
  loadPublicProjects,
  loadPublicProjectDetail,
  readPublicApiOrigin,
} from "./public-projects-client.js";

const API_ORIGIN = "http://127.0.0.1:3000";
const STATIC_PROJECTS = [{ name: "Static Project" }];
const PROJECT = {
  number: "File 01",
  name: "Published Project",
  category: "Personal Project",
  description: "Published description",
  tech: ["React"],
  repo: "https://example.com/repository",
  slug: "published-project",
};

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
    status,
  });
}

test("uses static Projects only after an authoritative never-published status", async () => {
  const requests = [];
  const fetchImpl = async (url) => {
    requests.push(url);
    return jsonResponse({ status: "never-published" });
  };

  const result = await loadPublicProjects({
    apiOrigin: API_ORIGIN,
    fetchImpl,
    resource: "featured",
    staticProjects: STATIC_PROJECTS,
  });

  assert.deepEqual(result, STATIC_PROJECTS);
  assert.notEqual(result, STATIC_PROJECTS);
  assert.deepEqual(requests, [`${API_ORIGIN}/api/projects/status`]);
});

test("returns a validated published response without mixing static Projects", async () => {
  const responses = [
    jsonResponse({ status: "published" }),
    jsonResponse({
      projects: [
        PROJECT,
        { ...PROJECT, slug: "published-two" },
        { ...PROJECT, slug: "published-three" },
      ],
    }),
  ];

  const result = await loadPublicProjects({
    apiOrigin: API_ORIGIN,
    fetchImpl: async () => responses.shift(),
    resource: "featured",
    staticProjects: STATIC_PROJECTS,
  });

  assert.deepEqual(
    result.map(({ slug }) => slug),
    ["published-project", "published-two", "published-three"],
  );
  assert.equal(result.some(({ name }) => name === "Static Project"), false);
});

test("rejects published failures and malformed responses instead of falling back", async () => {
  await assert.rejects(
    loadPublicProjects({
      apiOrigin: API_ORIGIN,
      fetchImpl: async (url) =>
        url.endsWith("/status")
          ? jsonResponse({ status: "published" })
          : jsonResponse({ error: { code: "FAILED" } }, 503),
      resource: "featured",
      staticProjects: STATIC_PROJECTS,
    }),
    /could not be loaded/i,
  );

  await assert.rejects(
    loadPublicProjects({
      apiOrigin: API_ORIGIN,
      fetchImpl: async () => jsonResponse({ status: "unexpected" }),
      resource: "featured",
      staticProjects: STATIC_PROJECTS,
    }),
    /unexpected response/i,
  );
});

test("rejects blank public card fields and invalid slugs", async () => {
  for (const invalidProject of [
    { ...PROJECT, name: "   " },
    { ...PROJECT, role: "" },
    { ...PROJECT, tech: ["React", " "] },
    { ...PROJECT, slug: "Invalid Slug" },
    {
      ...PROJECT,
      cover: { mediaId: "11111111-1111-1111-1111-111111111111", altText: "Cover" },
    },
  ]) {
    const responses = [
      jsonResponse({ status: "published" }),
      jsonResponse({
        projects: [
          invalidProject,
          { ...PROJECT, slug: "published-two" },
          { ...PROJECT, slug: "published-three" },
        ],
      }),
    ];

    await assert.rejects(
      loadPublicProjects({
        apiOrigin: API_ORIGIN,
        fetchImpl: async () => responses.shift(),
        resource: "featured",
        staticProjects: STATIC_PROJECTS,
      }),
      /unexpected response/i,
    );
  }
});

test("applies one bounded timeout to the complete read", async () => {
  let observedSignal;
  const fetchImpl = (_url, { signal }) => {
    observedSignal = signal;
    return new Promise((_resolve, reject) => {
      signal.addEventListener("abort", () => reject(signal.reason), {
        once: true,
      });
    });
  };

  await assert.rejects(
    loadPublicProjects({
      apiOrigin: API_ORIGIN,
      fetchImpl,
      resource: "featured",
      staticProjects: STATIC_PROJECTS,
      timeoutMs: 5,
    }),
    /timed out/i,
  );
  assert.equal(observedSignal.aborted, true);
});

test("validates the configured public API origin", () => {
  assert.equal(readPublicApiOrigin(API_ORIGIN), API_ORIGIN);
  assert.throws(
    () => readPublicApiOrigin("https://user@example.com/path"),
    /must be an HTTP\(S\) origin/i,
  );
});

test("validates Project detail galleries and builds stable media routes", async () => {
  const mediaId = "11111111-1111-4111-8111-111111111111";
  const responses = [
    jsonResponse({ status: "published" }),
    jsonResponse({
      ...PROJECT,
      cover: { mediaId, altText: "Dashboard cover" },
      gallery: [{ mediaId, altText: "Dashboard cover" }],
      longDescriptionMarkdown: "## Details",
    }),
  ];

  const project = await loadPublicProjectDetail({
    apiOrigin: API_ORIGIN,
    fetchImpl: async () => responses.shift(),
    slug: PROJECT.slug,
  });

  assert.equal(project.cover.url, `${API_ORIGIN}/api/media/${mediaId}`);
  assert.equal(project.gallery[0].url, `${API_ORIGIN}/api/media/${mediaId}`);
});
