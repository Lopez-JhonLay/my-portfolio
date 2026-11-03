import { describe, expect, it, vi } from "vitest";

import {
  createDrizzleTransactionSessionBoundary,
  type ProjectDatabase,
  type ProjectDatabaseTransaction,
  type TransactionSessionBoundary,
} from "../db/database-session.ts";
import {
  createProjectMutationService,
  type MutationOperationRecord,
  type ProjectMutationQueries,
} from "./project-mutation-service.ts";
import {
  projectIdSchema,
  type DraftFeaturedSlots,
  type ProjectId,
  type ProjectVersion,
} from "./project-contract.ts";

type FakeProject = {
  draft: ProjectVersion;
  revision: bigint;
};

type FakeState = {
  featured: { revision: bigint; slots: DraftFeaturedSlots };
  nextProjectNumber: number;
  operations: Map<string, MutationOperationRecord>;
  projects: Map<ProjectId, FakeProject>;
};

function copyState(state: FakeState): FakeState {
  return structuredClone(state);
}

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

function createFakeService() {
  let state: FakeState = {
    featured: { revision: 1n, slots: [null, null, null] },
    nextProjectNumber: 1,
    operations: new Map(),
    projects: new Map(),
  };
  let failAfterClaim = false;

  const sessions: TransactionSessionBoundary<FakeState> = {
    withTransaction: async (mutate) => {
      const transactionState = copyState(state);
      const result = await mutate(transactionState);
      state = transactionState;
      return result;
    },
  };
  const createQueries = (
    transactionState: FakeState,
  ): ProjectMutationQueries => ({
    completeOperation: (operationId, completion) => {
      const operation = transactionState.operations.get(operationId);
      if (operation === undefined || operation.status !== "pending")
        return Promise.resolve(false);

      transactionState.operations.set(operationId, {
        ...operation,
        ...completion,
      });
      return Promise.resolve(true);
    },
    countProjects: (projectIds) =>
      Promise.resolve(
        new Set(
          projectIds.filter((projectId) =>
            transactionState.projects.has(projectId),
          ),
        ).size,
      ),
    insertOperation: (operation) => {
      if (transactionState.operations.has(operation.operationId)) {
        return Promise.resolve(false);
      }
      transactionState.operations.set(operation.operationId, operation);
      return Promise.resolve(true);
    },
    insertProject: () => {
      const projectId = projectIdSchema.parse(
        `00000000-0000-4000-8000-${String(transactionState.nextProjectNumber).padStart(12, "0")}`,
      );
      transactionState.nextProjectNumber += 1;
      transactionState.projects.set(projectId, {
        draft: createDraft(),
        revision: 1n,
      });
      return Promise.resolve(projectId);
    },
    insertProjectDraft: (projectId, draft) => {
      const project = transactionState.projects.get(projectId);
      if (project === undefined) throw new Error("Fake Project is missing");
      project.draft = draft;
      return Promise.resolve();
    },
    lockFeaturedDraft: () =>
      Promise.resolve(copyState(transactionState).featured),
    lockOperation: (operationId) => {
      if (failAfterClaim) {
        failAfterClaim = false;
        throw new Error("uncertain database failure");
      }
      return Promise.resolve(
        transactionState.operations.get(operationId) ?? null,
      );
    },
    lockProjectRevision: (projectId) =>
      Promise.resolve(
        transactionState.projects.get(projectId)?.revision ?? null,
      ),
    projectExists: (projectId) =>
      Promise.resolve(transactionState.projects.has(projectId)),
    readOperation: (operationId) =>
      Promise.resolve(transactionState.operations.get(operationId) ?? null),
    updateFeaturedDraft: (expectedRevision, slots) => {
      if (transactionState.featured.revision !== expectedRevision) {
        return Promise.resolve(null);
      }
      transactionState.featured = {
        revision: expectedRevision + 1n,
        slots,
      };
      return Promise.resolve(expectedRevision + 1n);
    },
    updateProjectDraft: (projectId, expectedRevision, draft) => {
      const project = transactionState.projects.get(projectId);
      if (project === undefined || project.revision !== expectedRevision) {
        return Promise.resolve(null);
      }
      project.draft = draft;
      project.revision = expectedRevision + 1n;
      return Promise.resolve(project.revision);
    },
  });

  return {
    failNextExecution: () => {
      failAfterClaim = true;
    },
    getState: () => state,
    service: createProjectMutationService(sessions, createQueries),
  };
}

describe("Project mutation service", () => {
  it("runs each mutation callback once in one injected Drizzle transaction", async () => {
    const transactionSession = {
      name: "drizzle-transaction",
    } as unknown as ProjectDatabaseTransaction;
    const transaction = vi.fn(
      <Result>(
        mutate: (session: ProjectDatabaseTransaction) => Promise<Result>,
      ) => mutate(transactionSession),
    );
    const sessions = createDrizzleTransactionSessionBoundary({
      transaction,
    } as unknown as ProjectDatabase);

    const result = await sessions.withTransaction((session) =>
      Promise.resolve(session),
    );

    expect(result).toBe(transactionSession);
    expect(transaction).toHaveBeenCalledOnce();
  });

  it("creates one active included draft and replays the same operation", async () => {
    const context = createFakeService();
    const command = { operationId: "create-one", draft: createDraft() };

    const created = await context.service.createProjectDraft(command);
    const replayed = await context.service.createProjectDraft(command);

    expect(created).toEqual(replayed);
    expect(created).toMatchObject({
      status: "succeeded",
      outcomeCode: "project_draft_created",
      resultRevision: 1n,
    });
    expect(context.getState().projects).toHaveLength(1);
    expect(context.getState().operations).toHaveLength(1);
  });

  it("rejects reuse of an operation ID for different create content", async () => {
    const context = createFakeService();
    await context.service.createProjectDraft({
      operationId: "create-one",
      draft: createDraft(),
    });

    await expect(
      context.service.createProjectDraft({
        operationId: "create-one",
        draft: createDraft({ name: "Different Project" }),
      }),
    ).resolves.toEqual({
      operationId: "create-one",
      status: "operation-conflict",
    });
    expect(context.getState().projects).toHaveLength(1);
  });

  it("saves a Project draft, clears optional fields, and increments its revision", async () => {
    const context = createFakeService();
    const created = await context.service.createProjectDraft({
      operationId: "create-one",
      draft: createDraft(),
    });
    if (created.status !== "succeeded" || created.projectId === null) {
      throw new Error("Expected a created Project");
    }
    const clearedDraft = createDraft({
      role: undefined,
      repo: undefined,
      liveUrl: undefined,
      longDescriptionMarkdown: undefined,
    });

    const result = await context.service.saveProjectDraft({
      operationId: "save-one",
      projectId: created.projectId,
      expectedRevision: 1n,
      draft: clearedDraft,
    });

    expect(result).toMatchObject({
      status: "succeeded",
      outcomeCode: "project_draft_saved",
      resultRevision: 2n,
    });
    expect(context.getState().projects.get(created.projectId)).toEqual({
      draft: clearedDraft,
      revision: 2n,
    });
  });

  it("records a stale Project save without changing the draft", async () => {
    const context = createFakeService();
    const created = await context.service.createProjectDraft({
      operationId: "create-one",
      draft: createDraft(),
    });
    if (created.status !== "succeeded" || created.projectId === null) {
      throw new Error("Expected a created Project");
    }

    const result = await context.service.saveProjectDraft({
      operationId: "stale-save",
      projectId: created.projectId,
      expectedRevision: 9n,
      draft: createDraft({ name: "Must not persist" }),
    });

    expect(result).toMatchObject({
      status: "failed",
      outcomeCode: "stale_revision",
      resultRevision: 1n,
    });
    expect(context.getState().projects.get(created.projectId)?.draft.name).toBe(
      "Project One",
    );
  });

  it("leaves a claimed operation pending after an uncertain failure and never retries it", async () => {
    const context = createFakeService();
    const created = await context.service.createProjectDraft({
      operationId: "create-one",
      draft: createDraft(),
    });
    if (created.status !== "succeeded" || created.projectId === null) {
      throw new Error("Expected a created Project");
    }
    const command = {
      operationId: "uncertain-save",
      projectId: created.projectId,
      expectedRevision: 1n,
      draft: createDraft({ name: "Uncertain Project" }),
    };
    context.failNextExecution();

    await expect(context.service.saveProjectDraft(command)).rejects.toThrow(
      "uncertain database failure",
    );
    await expect(context.service.saveProjectDraft(command)).resolves.toEqual({
      operationId: "uncertain-save",
      kind: "save_project_draft",
      projectId: created.projectId,
      status: "pending",
    });
    await expect(
      context.service.saveProjectDraft({
        ...command,
        draft: createDraft({ name: "Conflicting uncertain retry" }),
      }),
    ).resolves.toEqual({
      operationId: "uncertain-save",
      status: "operation-conflict",
    });
    expect(context.getState().projects.get(created.projectId)?.revision).toBe(
      1n,
    );
  });

  it("does not claim a save operation for a missing Project", async () => {
    const context = createFakeService();
    const missingProjectId = projectIdSchema.parse(
      "99999999-9999-4999-8999-999999999999",
    );

    await expect(
      context.service.saveProjectDraft({
        operationId: "missing-project-save",
        projectId: missingProjectId,
        expectedRevision: 1n,
        draft: createDraft(),
      }),
    ).resolves.toEqual({
      status: "project-not-found",
      projectId: missingProjectId,
    });
    expect(context.getState().operations).toHaveLength(0);
  });

  it("saves incomplete and duplicate featured slots", async () => {
    const context = createFakeService();
    const created = await context.service.createProjectDraft({
      operationId: "create-one",
      draft: createDraft(),
    });
    if (created.status !== "succeeded" || created.projectId === null) {
      throw new Error("Expected a created Project");
    }
    const slots: DraftFeaturedSlots = [
      created.projectId,
      null,
      created.projectId,
    ];

    const result = await context.service.saveDraftFeatured({
      operationId: "featured-one",
      expectedRevision: 1n,
      slots,
    });

    expect(result).toMatchObject({
      status: "succeeded",
      outcomeCode: "featured_draft_saved",
      resultRevision: 2n,
    });
    expect(context.getState().featured).toEqual({ revision: 2n, slots });
  });

  it("records invalid featured references and stale featured revisions", async () => {
    const context = createFakeService();
    const missingId = projectIdSchema.parse(
      "99999999-9999-4999-8999-999999999999",
    );

    await expect(
      context.service.saveDraftFeatured({
        operationId: "invalid-featured",
        expectedRevision: 1n,
        slots: [missingId, null, null],
      }),
    ).resolves.toMatchObject({
      status: "failed",
      outcomeCode: "invalid_featured_reference",
      resultRevision: 1n,
    });
    await expect(
      context.service.saveDraftFeatured({
        operationId: "stale-featured",
        expectedRevision: 2n,
        slots: [null, null, null],
      }),
    ).resolves.toMatchObject({
      status: "failed",
      outcomeCode: "stale_revision",
      resultRevision: 1n,
    });
  });

  it("returns authoritative operation state without executing a mutation", async () => {
    const context = createFakeService();

    await expect(
      context.service.readMutationOperation("never-claimed"),
    ).resolves.toEqual({ status: "not-found" });
    const created = await context.service.createProjectDraft({
      operationId: "create-one",
      draft: createDraft(),
    });
    await expect(
      context.service.readMutationOperation("create-one"),
    ).resolves.toEqual(created);
  });
});
