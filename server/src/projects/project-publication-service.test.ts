import { describe, expect, it } from "vitest";

import type { TransactionSessionBoundary } from "../db/database-session.ts";
import {
  projectIdSchema,
  type ProjectId,
  type ProjectRecord,
  type ProjectVersion,
} from "./project-contract.ts";
import {
  createProjectPublicationService,
  type ProjectPublicationQueries,
} from "./project-publication-service.ts";
import type { MutationOperationRecord } from "./project-mutation-service.ts";

type PublishedSnapshot = {
  readonly operationId: string;
  readonly projectNames: readonly string[];
  readonly revision: bigint;
};

type FakeState = {
  readonly operations: Map<string, MutationOperationRecord>;
  projects: readonly ProjectRecord[];
  featuredProjectIds: readonly [
    ProjectId | null,
    ProjectId | null,
    ProjectId | null,
  ];
  published: PublishedSnapshot | null;
  publishExecutions: number;
};

function createDraft(
  index: number,
  overrides: Partial<ProjectVersion> = {},
): ProjectVersion {
  return {
    number: `File 0${index}`,
    name: `Project ${index}`,
    category: "Personal Project",
    description: `Description ${index}`,
    tech: ["TypeScript"],
    repo: `https://example.com/project-${index}`,
    slug: `project-${index}`,
    groupOrder: index,
    ...overrides,
  };
}

function createProject(
  index: number,
  overrides: Partial<ProjectRecord> = {},
): ProjectRecord {
  return {
    id: projectIdSchema.parse(`00000000-0000-4000-8000-00000000000${index}`),
    lifecycle: "active",
    publicationIntent: "include",
    draft: createDraft(index),
    published: null,
    ...overrides,
  };
}

function copyState(state: FakeState): FakeState {
  return {
    operations: new Map(
      [...state.operations].map(([id, operation]) => [id, { ...operation }]),
    ),
    projects: state.projects.map((project) => ({
      ...project,
      draft: { ...project.draft, tech: [...project.draft.tech] },
    })),
    featuredProjectIds: [...state.featuredProjectIds],
    published:
      state.published === null
        ? null
        : {
            ...state.published,
            projectNames: [...state.published.projectNames],
          },
    publishExecutions: state.publishExecutions,
  };
}

function createFakeService() {
  const firstProject = createProject(1);
  const secondProject = createProject(2);
  const thirdProject = createProject(3);
  const projects = [firstProject, secondProject, thirdProject];
  let state: FakeState = {
    operations: new Map(),
    projects,
    featuredProjectIds: [firstProject.id, secondProject.id, thirdProject.id],
    published: null,
    publishExecutions: 0,
  };
  let transactionState = state;
  let failPublication = false;
  const isolationLevels: (string | undefined)[] = [];

  const sessions: TransactionSessionBoundary<FakeState> = {
    withTransaction: async (mutate, options) => {
      isolationLevels.push(options?.isolationLevel);
      transactionState = copyState(state);
      try {
        const result = await mutate(transactionState);
        state = transactionState;
        return result;
      } finally {
        transactionState = state;
      }
    },
  };

  const createQueries = (session: FakeState): ProjectPublicationQueries => ({
    completeOperation: (operationId, completion) => {
      const operation = session.operations.get(operationId);
      if (operation === undefined || operation.status !== "pending") {
        return Promise.resolve(false);
      }
      session.operations.set(operationId, {
        ...operation,
        ...completion,
      });
      return Promise.resolve(true);
    },
    insertOperation: (operation) => {
      if (session.operations.has(operation.operationId)) {
        return Promise.resolve(false);
      }
      session.operations.set(operation.operationId, operation);
      return Promise.resolve(true);
    },
    lockCandidate: () =>
      Promise.resolve({
        featuredProjectIds: session.featuredProjectIds,
        projects: session.projects,
        reservedSlugs: [] as const,
        snapshotRevision: session.published?.revision ?? null,
      }),
    lockOperation: (operationId) =>
      Promise.resolve(session.operations.get(operationId) ?? null),
    publishSnapshot: ({ candidate, operationId, snapshotRevision }) => {
      session.publishExecutions += 1;
      session.published = {
        operationId,
        projectNames: candidate.projects
          .filter(
            (project) =>
              project.lifecycle === "active" &&
              project.publicationIntent === "include",
          )
          .map((project) => project.draft.name),
        revision: snapshotRevision,
      };
      if (failPublication) {
        failPublication = false;
        throw new Error("simulated uncertain publication failure");
      }
      return Promise.resolve();
    },
    readOperation: (operationId) =>
      Promise.resolve(session.operations.get(operationId) ?? null),
  });

  return {
    failNextPublication: () => {
      failPublication = true;
    },
    getState: () => state,
    isolationLevels,
    replaceFeatured: (featuredProjectIds: FakeState["featuredProjectIds"]) => {
      state.featuredProjectIds = featuredProjectIds;
    },
    replaceProjects: (nextProjects: readonly ProjectRecord[]) => {
      state.projects = nextProjects;
    },
    service: createProjectPublicationService(sessions, createQueries),
  };
}

describe("Project publication service", () => {
  it("publishes one complete snapshot in a serializable transaction and replays it", async () => {
    const context = createFakeService();

    const published = await context.service.publishUpdates({
      operationId: "11111111-1111-4111-8111-111111111111",
    });
    const replayed = await context.service.publishUpdates({
      operationId: "11111111-1111-4111-8111-111111111111",
    });

    expect(published).toEqual(replayed);
    expect(published).toMatchObject({
      status: "succeeded",
      outcomeCode: "published",
      snapshotRevision: 1n,
    });
    expect(context.getState().published).toMatchObject({
      projectNames: ["Project 1", "Project 2", "Project 3"],
      revision: 1n,
    });
    expect(context.getState().publishExecutions).toBe(1);
    expect(context.isolationLevels).toContain("serializable");
  });

  it("records invalid featured state without changing the published snapshot", async () => {
    const context = createFakeService();
    const firstProjectId = context.getState().projects[0]?.id;
    if (firstProjectId === undefined) throw new Error("Missing fake Project");
    context.replaceFeatured([firstProjectId, firstProjectId, null]);

    await expect(
      context.service.publishUpdates({
        operationId: "22222222-2222-4222-8222-222222222222",
      }),
    ).resolves.toMatchObject({
      status: "failed",
      outcomeCode: "publish_not_ready",
    });
    expect(context.getState().published).toBeNull();
    expect(context.getState().publishExecutions).toBe(0);
  });

  it("blocks linkless drafts while the publication policy remains unresolved", async () => {
    const context = createFakeService();
    const projects = context.getState().projects;
    const first = projects[0];
    if (first === undefined) throw new Error("Missing fake Project");
    context.replaceProjects([
      {
        ...first,
        draft: createDraft(1, { repo: undefined, liveUrl: undefined }),
      },
      ...projects.slice(1),
    ]);

    await expect(
      context.service.publishUpdates({
        operationId: "33333333-3333-4333-8333-333333333333",
      }),
    ).resolves.toMatchObject({
      status: "failed",
      outcomeCode: "publish_not_ready",
    });
    expect(context.getState().published).toBeNull();
  });

  it("rolls back every published change and leaves the claimed operation pending on uncertainty", async () => {
    const context = createFakeService();
    await context.service.publishUpdates({
      operationId: "44444444-4444-4444-8444-444444444444",
    });
    const previousSnapshot = context.getState().published;
    context.replaceProjects(
      context.getState().projects.map((project, index) =>
        index === 0
          ? {
              ...project,
              draft: { ...project.draft, name: "Updated Project" },
            }
          : project,
      ),
    );
    context.failNextPublication();

    await expect(
      context.service.publishUpdates({
        operationId: "55555555-5555-4555-8555-555555555555",
      }),
    ).rejects.toThrow("simulated uncertain publication failure");

    expect(context.getState().published).toEqual(previousSnapshot);
    await expect(
      context.service.readPublicationOperation(
        "55555555-5555-4555-8555-555555555555",
      ),
    ).resolves.toMatchObject({ status: "pending" });
  });
});
