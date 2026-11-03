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
    operationResult?: MutationOperationReadResult;
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
      Promise.reject(new Error("Featured saves are outside this API")),
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
});
