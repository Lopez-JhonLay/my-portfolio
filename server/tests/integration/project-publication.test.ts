import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  createDrizzleSnapshotSessionBoundary,
  createDrizzleTransactionSessionBoundary,
  type ProjectDatabase,
} from "../../src/db/database-session.ts";
import {
  draftFeaturedState,
  projectDrafts,
  projectOperations,
  projects,
  publishedProjects,
  publishedSlugs,
  publishedState,
} from "../../src/db/schema/project-schema.ts";
import type {
  ProjectId,
  ProjectVersion,
} from "../../src/projects/project-contract.ts";
import { createDrizzleProjectMutationService } from "../../src/projects/project-mutation-repository.ts";
import type { ProjectMutationService } from "../../src/projects/project-mutation-service.ts";
import {
  createDrizzleProjectPublicationQueries,
  createDrizzleProjectPublicationService,
} from "../../src/projects/project-publication-repository.ts";
import { createProjectPublicationService } from "../../src/projects/project-publication-service.ts";
import { createDrizzlePublishedProjectReadRepository } from "../../src/projects/published-project-repository.ts";
import {
  openPostgresqlTestHarness,
  type PostgresqlTestHarness,
} from "./postgresql-test-harness.ts";

const MIGRATION_URL = new URL(
  "../../drizzle/0000_initial-project-schema.sql",
  import.meta.url,
);

function createDraft(
  index: number,
  overrides: Partial<ProjectVersion> = {},
): ProjectVersion {
  return {
    number: `File 0${index}`,
    name: `Project ${index}`,
    category: "Personal Project",
    description: `Description ${index}`,
    tech: ["TypeScript", "PostgreSQL"],
    repo: `https://example.com/project-${index}`,
    slug: `project-${index}`,
    groupOrder: index,
    ...overrides,
  };
}

function requireProjectId(
  result: Awaited<ReturnType<ProjectMutationService["createProjectDraft"]>>,
): ProjectId {
  if (result.status !== "succeeded" || result.projectId === null) {
    throw new Error("Expected a created Project");
  }
  return result.projectId;
}

describe("Project publication on PostgreSQL", () => {
  let harness: PostgresqlTestHarness;
  let mutations: ProjectMutationService;
  let publications: ReturnType<typeof createDrizzleProjectPublicationService>;

  beforeAll(async () => {
    harness = await openPostgresqlTestHarness({
      environment: process.env,
      migrationUrl: MIGRATION_URL,
    });
    const sessions = createDrizzleTransactionSessionBoundary(harness.database);
    mutations = createDrizzleProjectMutationService(sessions);
    publications = createDrizzleProjectPublicationService(sessions);
  });

  beforeEach(async () => {
    await harness.database.transaction(async (session) => {
      await session.delete(publishedState);
      await session.delete(publishedProjects);
      await session.delete(publishedSlugs);
      await session.delete(projectOperations);
      await session.delete(draftFeaturedState);
      await session.delete(projectDrafts);
      await session.delete(projects);
      await session.insert(draftFeaturedState).values({ singletonId: 1 });
    });
  });

  afterAll(async () => {
    if (harness !== undefined) await harness.cleanup();
  });

  async function createCandidate() {
    const projectIds = await Promise.all(
      [1, 2, 3].map(async (index) =>
        requireProjectId(
          await mutations.createProjectDraft({
            operationId: `create-project-${index}`,
            draft: createDraft(index),
          }),
        ),
      ),
    );
    const first = projectIds[0];
    const second = projectIds[1];
    const third = projectIds[2];
    if (first === undefined || second === undefined || third === undefined) {
      throw new Error("Expected three Project identifiers");
    }
    await mutations.saveDraftFeatured({
      operationId: "save-featured",
      expectedRevision: 1n,
      slots: [third, first, second],
    });
    return { first, second, third };
  }

  function publishedReads(database: ProjectDatabase = harness.database) {
    return createDrizzlePublishedProjectReadRepository(
      createDrizzleSnapshotSessionBoundary(database),
    );
  }

  it("publishes one complete snapshot in featured order and replays duplicate requests", async () => {
    await createCandidate();
    await expect(publishedReads().readStatus()).resolves.toEqual({
      status: "never-published",
    });
    await expect(publishedReads().readGroups()).resolves.toEqual({
      status: "never-published",
    });

    const first = await publications.publishUpdates({
      operationId: "publish-complete-snapshot",
    });
    const replay = await publications.publishUpdates({
      operationId: "publish-complete-snapshot",
    });

    expect(replay).toEqual(first);
    expect(first).toMatchObject({
      status: "succeeded",
      snapshotRevision: 1n,
    });
    await expect(publishedReads().readStatus()).resolves.toEqual({
      status: "published",
    });
    await expect(publishedReads().readFeatured()).resolves.toMatchObject({
      status: "available",
      data: {
        projects: [
          { name: "Project 3" },
          { name: "Project 1" },
          { name: "Project 2" },
        ],
      },
    });
    await expect(
      harness.database
        .select({ value: count() })
        .from(projectOperations)
        .where(eq(projectOperations.kind, "publish")),
    ).resolves.toEqual([{ value: 1 }]);
  });

  it("rejects invalid featured drafts without changing the published snapshot", async () => {
    const { first, third } = await createCandidate();
    await publications.publishUpdates({ operationId: "publish-baseline" });
    await mutations.saveDraftFeatured({
      operationId: "save-invalid-featured",
      expectedRevision: 2n,
      slots: [first, first, third],
    });

    await expect(
      publications.publishUpdates({ operationId: "publish-invalid" }),
    ).resolves.toMatchObject({
      status: "failed",
      outcomeCode: "publish_not_ready",
    });
    await expect(publishedReads().readFeatured()).resolves.toMatchObject({
      status: "available",
      data: {
        projects: [
          { name: "Project 3" },
          { name: "Project 1" },
          { name: "Project 2" },
        ],
      },
    });
  });

  it("rolls back partial writes and preserves a pending operation after uncertainty", async () => {
    const { first } = await createCandidate();
    await publications.publishUpdates({ operationId: "publish-baseline" });
    await mutations.saveProjectDraft({
      operationId: "save-updated-project",
      projectId: first,
      expectedRevision: 1n,
      draft: createDraft(1, { name: "Updated Project" }),
    });
    const failingService = createProjectPublicationService(
      createDrizzleTransactionSessionBoundary(harness.database),
      (session) => {
        const queries = createDrizzleProjectPublicationQueries(session);
        return {
          ...queries,
          publishSnapshot: async (input) => {
            await queries.publishSnapshot(input);
            throw new Error("simulated uncertain commit result");
          },
        };
      },
    );

    await expect(
      failingService.publishUpdates({ operationId: "publish-uncertain" }),
    ).rejects.toThrow("simulated uncertain commit result");
    const grouped = await publishedReads().readGroups();
    if (grouped.status !== "available") {
      throw new Error("Expected the baseline published snapshot");
    }
    expect(
      grouped.data.flatMap((group) =>
        group.projects.map((project) => project.name),
      ),
    ).toEqual(["Project 1", "Project 2", "Project 3"]);
    await expect(
      publications.readPublicationOperation("publish-uncertain"),
    ).resolves.toMatchObject({ status: "pending" });
  });
});
