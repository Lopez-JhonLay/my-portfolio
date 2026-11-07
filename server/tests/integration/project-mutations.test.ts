import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createDrizzleTransactionSessionBoundary,
  type ProjectDatabase,
} from "../../src/db/database-session.ts";
import {
  draftFeaturedState,
  projectDrafts,
  projects,
  publishedProjects,
  publishedSlugs,
  publishedState,
} from "../../src/db/schema/project-schema.ts";
import {
  projectIdSchema,
  type ProjectVersion,
} from "../../src/projects/project-contract.ts";
import {
  createDrizzleProjectMutationQueries,
  createDrizzleProjectMutationService,
} from "../../src/projects/project-mutation-repository.ts";
import {
  createProjectMutationService,
  type ProjectMutationService,
} from "../../src/projects/project-mutation-service.ts";
import {
  openPostgresqlTestHarness,
  type PostgresqlTestHarness,
} from "./postgresql-test-harness.ts";

const MIGRATION_URL = new URL(
  "../../drizzle/0000_initial-project-schema.sql",
  import.meta.url,
);

function createDraft(overrides: Partial<ProjectVersion> = {}): ProjectVersion {
  return {
    number: "File 01",
    name: "Project One",
    category: "Personal Project",
    description: "Draft description",
    role: "Developer",
    tech: ["TypeScript", "PostgreSQL"],
    repo: "https://example.com/repository",
    liveUrl: "https://example.com/project",
    slug: "project-one",
    longDescriptionMarkdown: "## Draft details",
    groupOrder: 1,
    ...overrides,
  };
}

function createService(database: ProjectDatabase): ProjectMutationService {
  return createDrizzleProjectMutationService(
    createDrizzleTransactionSessionBoundary(database),
  );
}

function requireCreatedProjectId(
  result: Awaited<ReturnType<ProjectMutationService["createProjectDraft"]>>,
) {
  if (result.status !== "succeeded" || result.projectId === null) {
    throw new Error("Expected a created Project");
  }
  return result.projectId;
}

describe("Project mutations on PostgreSQL", () => {
  let harness: PostgresqlTestHarness;
  let service: ProjectMutationService;

  beforeAll(async () => {
    harness = await openPostgresqlTestHarness({
      environment: process.env,
      migrationUrl: MIGRATION_URL,
    });
    service = createService(harness.database);
  });

  afterAll(async () => {
    if (harness !== undefined) await harness.cleanup();
  });

  it("atomically creates and idempotently replays an active included draft", async () => {
    const command = {
      operationId: "integration-create-one",
      draft: createDraft(),
    };

    const created = await service.createProjectDraft(command);
    const replayed = await service.createProjectDraft(command);
    const projectId = requireCreatedProjectId(created);

    expect(replayed).toEqual(created);
    await expect(
      service.createProjectDraft({
        ...command,
        draft: createDraft({ name: "Conflicting create" }),
      }),
    ).resolves.toEqual({
      operationId: command.operationId,
      status: "operation-conflict",
    });
    await expect(
      harness.database
        .select({
          lifecycle: projects.lifecycle,
          publicationIntent: projects.publicationIntent,
          revision: projects.draftRevision,
        })
        .from(projects)
        .where(eq(projects.id, projectId)),
    ).resolves.toEqual([
      { lifecycle: "active", publicationIntent: "include", revision: 1n },
    ]);
    await expect(
      harness.database.select({ value: count() }).from(projects),
    ).resolves.toEqual([{ value: 1 }]);
  });

  it("serializes concurrent Project saves and clears optional draft fields", async () => {
    const projectId = requireCreatedProjectId(
      await service.createProjectDraft({
        operationId: "integration-create-concurrent-project",
        draft: createDraft({ slug: "concurrent-project" }),
      }),
    );
    const clearedDraft = createDraft({
      name: "Cleared optional fields",
      role: undefined,
      repo: undefined,
      liveUrl: undefined,
      slug: "concurrent-project",
      longDescriptionMarkdown: undefined,
    });

    await expect(
      service.saveProjectDraft({
        operationId: "integration-clear-project-fields",
        projectId,
        expectedRevision: 1n,
        draft: clearedDraft,
      }),
    ).resolves.toMatchObject({
      status: "succeeded",
      outcomeCode: "project_draft_saved",
      resultRevision: 2n,
    });
    await expect(
      harness.database
        .select({
          role: projectDrafts.role,
          repo: projectDrafts.repo,
          liveUrl: projectDrafts.liveUrl,
          longDescriptionMarkdown: projectDrafts.longDescriptionMarkdown,
        })
        .from(projectDrafts)
        .where(eq(projectDrafts.projectId, projectId)),
    ).resolves.toEqual([
      { role: null, repo: null, liveUrl: null, longDescriptionMarkdown: null },
    ]);

    const results = await harness.withAdditionalDatabase(async (database) =>
      Promise.all([
        service.saveProjectDraft({
          operationId: "integration-concurrent-project-a",
          projectId,
          expectedRevision: 2n,
          draft: createDraft({
            name: "Concurrent first",
            slug: "concurrent-project",
          }),
        }),
        createService(database).saveProjectDraft({
          operationId: "integration-concurrent-project-b",
          projectId,
          expectedRevision: 2n,
          draft: createDraft({
            name: "Concurrent alternative",
            slug: "concurrent-project",
          }),
        }),
      ]),
    );

    expect(results.map(({ status }) => status).sort()).toEqual([
      "failed",
      "succeeded",
    ]);
    expect(results).toContainEqual(
      expect.objectContaining({
        status: "failed",
        outcomeCode: "stale_revision",
        resultRevision: 3n,
      }),
    );
    const [project] = await harness.database
      .select({ revision: projects.draftRevision })
      .from(projects)
      .where(eq(projects.id, projectId));
    expect(project?.revision).toBe(3n);
  });

  it("supports incomplete featured drafts and serializes concurrent revisions", async () => {
    const projectId = requireCreatedProjectId(
      await service.createProjectDraft({
        operationId: "integration-create-featured-project",
        draft: createDraft({ slug: "featured-project" }),
      }),
    );
    const missingProjectId = projectIdSchema.parse(
      "99999999-9999-4999-8999-999999999999",
    );

    await expect(
      service.saveDraftFeatured({
        operationId: "integration-invalid-featured",
        expectedRevision: 1n,
        slots: [missingProjectId, null, null],
      }),
    ).resolves.toMatchObject({
      status: "failed",
      outcomeCode: "invalid_featured_reference",
      resultRevision: 1n,
    });
    await expect(
      service.saveDraftFeatured({
        operationId: "integration-incomplete-featured",
        expectedRevision: 1n,
        slots: [projectId, null, projectId],
      }),
    ).resolves.toMatchObject({
      status: "succeeded",
      outcomeCode: "featured_draft_saved",
      resultRevision: 2n,
    });

    const results = await harness.withAdditionalDatabase(async (database) =>
      Promise.all([
        service.saveDraftFeatured({
          operationId: "integration-concurrent-featured-a",
          expectedRevision: 2n,
          slots: [null, projectId, null],
        }),
        createService(database).saveDraftFeatured({
          operationId: "integration-concurrent-featured-b",
          expectedRevision: 2n,
          slots: [projectId, projectId, null],
        }),
      ]),
    );

    expect(results.map(({ status }) => status).sort()).toEqual([
      "failed",
      "succeeded",
    ]);
    expect(results).toContainEqual(
      expect.objectContaining({
        status: "failed",
        outcomeCode: "stale_revision",
        resultRevision: 3n,
      }),
    );
    await expect(
      harness.database
        .select({ revision: draftFeaturedState.revision })
        .from(draftFeaturedState),
    ).resolves.toEqual([{ revision: 3n }]);
  });

  it("preserves a pending operation after an uncertain execution failure", async () => {
    const projectId = requireCreatedProjectId(
      await service.createProjectDraft({
        operationId: "integration-create-uncertain-project",
        draft: createDraft({ slug: "uncertain-project" }),
      }),
    );
    const command = {
      operationId: "integration-uncertain-project-save",
      projectId,
      expectedRevision: 1n,
      draft: createDraft({
        name: "Must remain uncertain",
        slug: "uncertain-project",
      }),
    };
    const failingService = createProjectMutationService(
      createDrizzleTransactionSessionBoundary(harness.database),
      (session) => ({
        ...createDrizzleProjectMutationQueries(session),
        lockOperation: () => {
          throw new Error("simulated uncertain execution failure");
        },
      }),
    );

    await expect(failingService.saveProjectDraft(command)).rejects.toThrow(
      "simulated uncertain execution failure",
    );
    await expect(service.saveProjectDraft(command)).resolves.toEqual({
      operationId: command.operationId,
      kind: "save_project_draft",
      projectId,
      status: "pending",
    });
    await expect(
      harness.database
        .select({ revision: projects.draftRevision })
        .from(projects)
        .where(eq(projects.id, projectId)),
    ).resolves.toEqual([{ revision: 1n }]);
  });

  it("never writes draft mutations into published tables", async () => {
    const [publishedProjectRows, publishedSlugRows, publishedStateRows] =
      await Promise.all([
        harness.database.select().from(publishedProjects),
        harness.database.select().from(publishedSlugs),
        harness.database.select().from(publishedState),
      ]);

    expect(publishedProjectRows).toEqual([]);
    expect(publishedSlugRows).toEqual([]);
    expect(publishedStateRows).toEqual([]);
  });
});
