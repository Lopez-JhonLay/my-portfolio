import request from "supertest";
import { describe, expect, it } from "vitest";

import { createApp } from "../../src/app.ts";
import { createAdminAuth } from "../../src/auth/admin-auth.ts";
import {
  createAdminProjectRouter,
  type AdminProjectDraftReadRepository,
} from "../../src/projects/admin-project-router.ts";
import {
  projectIdSchema,
  type ProjectVersion,
} from "../../src/projects/project-contract.ts";
import type {
  MutationCommandResult,
  MutationOperationReadResult,
  ProjectMutationService,
} from "../../src/projects/project-mutation-service.ts";
import type {
  PublicationCommandResult,
  PublicationOperationReadResult,
  ProjectPublicationService,
} from "../../src/projects/project-publication-service.ts";

const ADMIN_ORIGIN = "http://127.0.0.1:5174";
const PROJECT_ID = projectIdSchema.parse(
  "11111111-1111-4111-8111-111111111111",
);

function createDraft(overrides: Partial<ProjectVersion> = {}): ProjectVersion {
  return {
    number: "File 01",
    name: "Project One",
    category: "Personal Project",
    description: "Draft description",
    tech: ["TypeScript", "PostgreSQL"],
    slug: "project-one",
    groupOrder: 1,
    ...overrides,
  };
}

function createApi(
  options: {
    commandResult?: MutationCommandResult;
    featuredCommandResult?: MutationCommandResult;
    operationResult?: MutationOperationReadResult;
    publicationResult?: PublicationCommandResult;
    publicationStatus?: PublicationOperationReadResult;
  } = {},
) {
  const project = {
    id: PROJECT_ID,
    lifecycle: "active" as const,
    publicationIntent: "include" as const,
    revision: 1n,
    draft: createDraft(),
  };
  const readRepository: AdminProjectDraftReadRepository = {
    list: () => Promise.resolve({ projects: [project], totalItems: 1 }),
    read: (projectId) =>
      Promise.resolve(projectId === PROJECT_ID ? project : null),
    readFeatured: () =>
      Promise.resolve({ revision: 1n, slots: [PROJECT_ID, null, null] }),
  };
  const defaultCommandResult: MutationCommandResult = {
    operationId: "22222222-2222-4222-8222-222222222222",
    kind: "save_project_draft",
    projectId: PROJECT_ID,
    status: "succeeded",
    outcomeCode: "project_draft_saved",
    resultRevision: 2n,
  };
  const mutationService: ProjectMutationService = {
    createProjectDraft: () =>
      Promise.resolve(options.commandResult ?? defaultCommandResult),
    saveProjectDraft: () =>
      Promise.resolve(options.commandResult ?? defaultCommandResult),
    saveDraftFeatured: () =>
      Promise.resolve(
        options.featuredCommandResult ?? {
          operationId: "66666666-6666-4666-8666-666666666666",
          kind: "save_featured_draft",
          projectId: null,
          status: "succeeded",
          outcomeCode: "featured_draft_saved",
          resultRevision: 2n,
        },
      ),
    readMutationOperation: () =>
      Promise.resolve(
        options.operationResult ?? {
          operationId: "22222222-2222-4222-8222-222222222222",
          kind: "save_project_draft",
          projectId: PROJECT_ID,
          status: "pending",
        },
      ),
  };
  const defaultPublicationResult: PublicationCommandResult = {
    operationId: "44444444-4444-4444-8444-444444444444",
    kind: "publish",
    status: "succeeded",
    outcomeCode: "published",
    snapshotRevision: 1n,
  };
  const publicationService: ProjectPublicationService = {
    publishUpdates: () =>
      Promise.resolve(options.publicationResult ?? defaultPublicationResult),
    readPublicationOperation: () =>
      Promise.resolve(options.publicationStatus ?? defaultPublicationResult),
  };
  const auth = createAdminAuth({
    config: {
      adminOrigin: ADMIN_ORIGIN,
      adminUserId: "12345678",
      githubCallbackUrl: "http://127.0.0.1:3000/api/auth/github/callback",
      githubClientId: "test-client-id",
      sessionTtlMs: 60_000,
    },
    githubClient: {
      exchangeCode: () => Promise.resolve({ userId: "12345678" }),
    },
  });
  const session = auth.sessions.create("12345678");
  const app = createApp({
    adminOrigin: ADMIN_ORIGIN,
    adminProjectRouter: createAdminProjectRouter({
      mutationService,
      publicationService,
      readRepository,
      requireAdmin: auth.requireAdmin,
      requireCsrf: auth.requireCsrf,
    }),
    authRouter: auth.router,
  });

  return {
    app,
    cookie: `portfolio_cms_session=${session.sessionId}`,
    csrfToken: session.csrfToken,
  };
}

function authenticated(requestBuilder: request.Test, cookie: string) {
  return requestBuilder.set("Origin", ADMIN_ORIGIN).set("Cookie", cookie);
}

function responseBody(response: request.Response): unknown {
  return response.body as unknown;
}

describe("authenticated Project draft API", () => {
  it("protects every Project resource", async () => {
    const { app } = createApi();

    await expect(
      request(app).get("/api/admin/projects"),
    ).resolves.toMatchObject({
      status: 401,
      body: { error: { code: "UNAUTHORIZED" } },
    });
    await expect(
      request(app).get(`/api/admin/projects/${PROJECT_ID}`),
    ).resolves.toMatchObject({
      status: 401,
      body: { error: { code: "UNAUTHORIZED" } },
    });
    await expect(
      request(app).post("/api/admin/projects"),
    ).resolves.toMatchObject({
      status: 401,
      body: { error: { code: "UNAUTHORIZED" } },
    });
    await expect(
      request(app).post("/api/admin/project-publications"),
    ).resolves.toMatchObject({
      status: 401,
      body: { error: { code: "UNAUTHORIZED" } },
    });
    await expect(
      request(app).get("/api/admin/project-featured"),
    ).resolves.toMatchObject({
      status: 401,
      body: { error: { code: "UNAUTHORIZED" } },
    });
    await expect(
      request(app).get(
        "/api/admin/project-publications/44444444-4444-4444-8444-444444444444",
      ),
    ).resolves.toMatchObject({
      status: 401,
      body: { error: { code: "UNAUTHORIZED" } },
    });
  });

  it("lists and loads allowlisted draft DTOs", async () => {
    const { app, cookie } = createApi();
    const list = await authenticated(
      request(app).get("/api/admin/projects?page=1&pageSize=20"),
      cookie,
    );
    const detail = await authenticated(
      request(app).get(`/api/admin/projects/${PROJECT_ID}`),
      cookie,
    );

    expect(list.status).toBe(200);
    const expectedProject = {
      id: PROJECT_ID,
      lifecycle: "active",
      publicationIntent: "include",
      revision: "1",
      draft: createDraft(),
      gallery: [],
    };
    expect(responseBody(list)).toEqual({
      projects: [expectedProject],
      pagination: { page: 1, pageSize: 20, totalItems: 1, totalPages: 1 },
    });
    expect(detail.status).toBe(200);
    expect(responseBody(detail)).toEqual(expectedProject);
    expect(
      JSON.stringify({
        list: responseBody(list),
        detail: responseBody(detail),
      }),
    ).not.toMatch(/requestFingerprint|createdAt|updatedAt/);
  });

  it("strictly validates create requests and requires CSRF", async () => {
    const { app, cookie, csrfToken } = createApi();
    const body = { draft: createDraft() };
    const missingCsrf = await authenticated(
      request(app)
        .post("/api/admin/projects")
        .set("Idempotency-Key", "22222222-2222-4222-8222-222222222222")
        .send(body),
      cookie,
    );
    const unknownField = await authenticated(
      request(app)
        .post("/api/admin/projects")
        .set("X-CSRF-Token", csrfToken)
        .set("Idempotency-Key", "22222222-2222-4222-8222-222222222222")
        .send({ ...body, lifecycle: "active" }),
      cookie,
    );

    expect(missingCsrf.status).toBe(403);
    expect(responseBody(missingCsrf)).toMatchObject({
      error: { code: "CSRF_VALIDATION_FAILED" },
    });
    expect(unknownField.status).toBe(422);
    expect(responseBody(unknownField)).toMatchObject({
      error: { code: "VALIDATION_ERROR" },
    });
    expect(JSON.stringify(responseBody(unknownField))).not.toContain("active");
  });

  it("creates and saves drafts through client-stable operation IDs", async () => {
    const { app, cookie, csrfToken } = createApi();
    const createResponse = await authenticated(
      request(app)
        .post("/api/admin/projects")
        .set("X-CSRF-Token", csrfToken)
        .set("Idempotency-Key", "22222222-2222-4222-8222-222222222222")
        .send({ draft: createDraft() }),
      cookie,
    );
    const saveResponse = await authenticated(
      request(app)
        .put(`/api/admin/projects/${PROJECT_ID}/draft`)
        .set("X-CSRF-Token", csrfToken)
        .set("Idempotency-Key", "33333333-3333-4333-8333-333333333333")
        .send({ expectedRevision: "1", draft: createDraft() }),
      cookie,
    );

    expect(createResponse.status).toBe(201);
    expect(responseBody(createResponse)).toMatchObject({ id: PROJECT_ID });
    expect(saveResponse.status).toBe(200);
    expect(responseBody(saveResponse)).toMatchObject({ id: PROJECT_ID });
  });

  it("returns authoritative draft data for stale revision conflicts", async () => {
    const staleResult: MutationCommandResult = {
      operationId: "33333333-3333-4333-8333-333333333333",
      kind: "save_project_draft",
      projectId: PROJECT_ID,
      status: "failed",
      outcomeCode: "stale_revision",
      resultRevision: 1n,
    };
    const { app, cookie, csrfToken } = createApi({
      commandResult: staleResult,
    });
    const response = await authenticated(
      request(app)
        .put(`/api/admin/projects/${PROJECT_ID}/draft`)
        .set("X-CSRF-Token", csrfToken)
        .set("Idempotency-Key", "33333333-3333-4333-8333-333333333333")
        .send({
          expectedRevision: "1",
          draft: createDraft({ name: "Attempted value" }),
        }),
      cookie,
    );

    expect(response.status).toBe(409);
    expect(responseBody(response)).toMatchObject({
      error: {
        code: "STALE_REVISION",
        details: { authoritative: { id: PROJECT_ID, revision: "1" } },
      },
    });
    expect(JSON.stringify(responseBody(response))).not.toContain(
      "Attempted value",
    );
  });

  it("returns pending and not-found operation status safely", async () => {
    const pending = createApi();
    const pendingResponse = await authenticated(
      request(pending.app).get(
        "/api/admin/project-operations/22222222-2222-4222-8222-222222222222",
      ),
      pending.cookie,
    );
    const missing = createApi({ operationResult: { status: "not-found" } });
    const missingResponse = await authenticated(
      request(missing.app).get(
        "/api/admin/project-operations/22222222-2222-4222-8222-222222222222",
      ),
      missing.cookie,
    );

    expect(pendingResponse.status).toBe(200);
    expect(responseBody(pendingResponse)).toEqual({
      operationId: "22222222-2222-4222-8222-222222222222",
      kind: "save_project_draft",
      projectId: PROJECT_ID,
      status: "pending",
    });
    expect(missingResponse.status).toBe(404);
    expect(responseBody(missingResponse)).toMatchObject({
      error: { code: "NOT_FOUND" },
    });
  });

  it("publishes only with authentication, CSRF, and a client operation ID", async () => {
    const { app, cookie, csrfToken } = createApi();
    const missingCsrf = await authenticated(
      request(app)
        .post("/api/admin/project-publications")
        .set("Idempotency-Key", "44444444-4444-4444-8444-444444444444")
        .send({}),
      cookie,
    );
    const published = await authenticated(
      request(app)
        .post("/api/admin/project-publications")
        .set("X-CSRF-Token", csrfToken)
        .set("Idempotency-Key", "44444444-4444-4444-8444-444444444444")
        .send({}),
      cookie,
    );

    expect(missingCsrf.status).toBe(403);
    expect(published.status).toBe(200);
    expect(responseBody(published)).toEqual({
      operationId: "44444444-4444-4444-8444-444444444444",
      kind: "publish",
      status: "succeeded",
      outcomeCode: "published",
      snapshotRevision: "1",
    });
  });

  it("reads and saves ordered draft featured slots with CSRF protection", async () => {
    const { app, cookie, csrfToken } = createApi();
    const readResponse = await authenticated(
      request(app).get("/api/admin/project-featured"),
      cookie,
    );
    const saveResponse = await authenticated(
      request(app)
        .put("/api/admin/project-featured")
        .set("X-CSRF-Token", csrfToken)
        .set("Idempotency-Key", "66666666-6666-4666-8666-666666666666")
        .send({
          expectedRevision: "1",
          slots: [PROJECT_ID, null, null],
        }),
      cookie,
    );

    expect(readResponse.status).toBe(200);
    expect(responseBody(readResponse)).toEqual({
      revision: "1",
      slots: [PROJECT_ID, null, null],
    });
    expect(saveResponse.status).toBe(200);
    expect(responseBody(saveResponse)).toEqual({
      revision: "1",
      slots: [PROJECT_ID, null, null],
    });
  });

  it("returns actionable invalid-candidate and read-only publication outcomes", async () => {
    const failedOperation: PublicationCommandResult = {
      operationId: "44444444-4444-4444-8444-444444444444",
      kind: "publish",
      status: "failed",
      outcomeCode: "publish_not_ready",
    };
    const failed = createApi({ publicationResult: failedOperation });
    const failedResponse = await authenticated(
      request(failed.app)
        .post("/api/admin/project-publications")
        .set("X-CSRF-Token", failed.csrfToken)
        .set("Idempotency-Key", "44444444-4444-4444-8444-444444444444")
        .send({}),
      failed.cookie,
    );
    const pendingOperation: PublicationOperationReadResult = {
      operationId: "55555555-5555-4555-8555-555555555555",
      kind: "publish",
      status: "pending",
    };
    const pending = createApi({ publicationStatus: pendingOperation });
    const statusResponse = await authenticated(
      request(pending.app).get(
        "/api/admin/project-publications/55555555-5555-4555-8555-555555555555",
      ),
      pending.cookie,
    );

    expect(failedResponse.status).toBe(422);
    expect(responseBody(failedResponse)).toMatchObject({
      error: { code: "PUBLISH_NOT_READY" },
    });
    expect(statusResponse.status).toBe(200);
    expect(responseBody(statusResponse)).toEqual(pendingOperation);
  });
});
