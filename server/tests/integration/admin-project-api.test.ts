import { count } from "drizzle-orm";
import request from "supertest";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { z } from "zod";

import { createApp } from "../../src/app.ts";
import { createAdminAuth } from "../../src/auth/admin-auth.ts";
import {
  createDrizzleSnapshotSessionBoundary,
  createDrizzleTransactionSessionBoundary,
} from "../../src/db/database-session.ts";
import { publishedProjects } from "../../src/db/schema/project-schema.ts";
import { createAdminProjectRouter } from "../../src/projects/admin-project-router.ts";
import type { ProjectVersion } from "../../src/projects/project-contract.ts";
import { createDrizzleProjectDraftReadRepository } from "../../src/projects/project-draft-read-repository.ts";
import { createDrizzleProjectMutationService } from "../../src/projects/project-mutation-repository.ts";
import {
  openPostgresqlTestHarness,
  type PostgresqlTestHarness,
} from "./postgresql-test-harness.ts";

const ADMIN_ORIGIN = "http://127.0.0.1:5174";
const MIGRATION_URL = new URL(
  "../../drizzle/0000_initial-project-schema.sql",
  import.meta.url,
);

function createDraft(overrides: Partial<ProjectVersion> = {}): ProjectVersion {
  return {
    number: "File 01",
    name: "Project API integration",
    category: "Personal Project",
    description: "Draft description",
    tech: ["TypeScript", "PostgreSQL"],
    slug: "project-api-integration",
    groupOrder: 1,
    ...overrides,
  };
}

function responseBody(response: request.Response): unknown {
  return response.body as unknown;
}

const createdProjectSchema = z.strictObject({
  id: z.uuid(),
  lifecycle: z.enum(["active", "trashed"]),
  publicationIntent: z.enum(["include", "exclude"]),
  revision: z.string(),
  draft: z.unknown(),
});

describe("authenticated Project draft API on PostgreSQL", () => {
  let harness: PostgresqlTestHarness;

  beforeAll(async () => {
    harness = await openPostgresqlTestHarness({
      environment: process.env,
      migrationUrl: MIGRATION_URL,
    });
  });

  afterAll(async () => {
    if (harness !== undefined) await harness.cleanup();
  });

  it("creates, reads, saves, and recovers operations without publishing", async () => {
    const auth = createAdminAuth({
      config: {
        adminOrigin: ADMIN_ORIGIN,
        adminUserId: "12345678",
        githubCallbackUrl: "http://127.0.0.1:3000/api/auth/github/callback",
        githubClientId: "integration-client-id",
        sessionTtlMs: 60_000,
      },
      githubClient: {
        exchangeCode: () => Promise.resolve({ userId: "12345678" }),
      },
    });
    const session = auth.sessions.create("12345678");
    const app = createApp({
      adminOrigin: ADMIN_ORIGIN,
      authRouter: auth.router,
      adminProjectRouter: createAdminProjectRouter({
        mutationService: createDrizzleProjectMutationService(
          createDrizzleTransactionSessionBoundary(harness.database),
        ),
        readRepository: createDrizzleProjectDraftReadRepository(
          createDrizzleSnapshotSessionBoundary(harness.database),
        ),
        requireAdmin: auth.requireAdmin,
        requireCsrf: auth.requireCsrf,
      }),
    });
    const cookie = `portfolio_cms_session=${session.sessionId}`;
    const createOperationId = "11111111-1111-4111-8111-111111111111";
    const created = await request(app)
      .post("/api/admin/projects")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", cookie)
      .set("X-CSRF-Token", session.csrfToken)
      .set("Idempotency-Key", createOperationId)
      .send({ draft: createDraft() });

    expect(created.status).toBe(201);
    expect(responseBody(created)).toMatchObject({
      revision: "1",
      draft: createDraft(),
    });
    const createdBody = createdProjectSchema.parse(responseBody(created));
    const projectId = createdBody.id;

    const list = await request(app)
      .get("/api/admin/projects")
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", cookie);
    const detail = await request(app)
      .get(`/api/admin/projects/${projectId}`)
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", cookie);
    const operation = await request(app)
      .get(`/api/admin/project-operations/${createOperationId}`)
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", cookie);

    expect(responseBody(list)).toMatchObject({ projects: [createdBody] });
    expect(responseBody(detail)).toEqual(createdBody);
    expect(responseBody(operation)).toMatchObject({
      operationId: createOperationId,
      status: "succeeded",
      outcomeCode: "project_draft_created",
      resultRevision: "1",
    });

    const savedDraft = createDraft({ description: "Saved through the API" });
    const saved = await request(app)
      .put(`/api/admin/projects/${projectId}/draft`)
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", cookie)
      .set("X-CSRF-Token", session.csrfToken)
      .set("Idempotency-Key", "22222222-2222-4222-8222-222222222222")
      .send({ expectedRevision: "1", draft: savedDraft });
    const stale = await request(app)
      .put(`/api/admin/projects/${projectId}/draft`)
      .set("Origin", ADMIN_ORIGIN)
      .set("Cookie", cookie)
      .set("X-CSRF-Token", session.csrfToken)
      .set("Idempotency-Key", "33333333-3333-4333-8333-333333333333")
      .send({ expectedRevision: "1", draft: createDraft() });

    expect(saved.status).toBe(200);
    expect(responseBody(saved)).toMatchObject({
      revision: "2",
      draft: savedDraft,
    });
    expect(stale.status).toBe(409);
    expect(responseBody(stale)).toMatchObject({
      error: {
        code: "STALE_REVISION",
        details: { authoritative: { revision: "2", draft: savedDraft } },
      },
    });
    await expect(
      harness.database.select({ value: count() }).from(publishedProjects),
    ).resolves.toEqual([{ value: 0 }]);
  });
});
