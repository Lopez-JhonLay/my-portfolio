import { createHash } from "node:crypto";

import type { TransactionSessionBoundary } from "../db/database-session.ts";
import type {
  DraftFeaturedSlots,
  ProjectId,
  ProjectVersion,
} from "./project-contract.ts";

export type MutationOperationKind =
  "save_project_draft" | "save_featured_draft";
export type PersistedOperationKind =
  MutationOperationKind | "save_content_draft" | "publish";
export type MutationOutcomeCode =
  | "project_draft_created"
  | "project_draft_saved"
  | "featured_draft_saved"
  | "stale_revision"
  | "invalid_featured_reference";

type MutationOperationBase = {
  readonly operationId: string;
  readonly kind: PersistedOperationKind;
  readonly projectId: ProjectId | null;
  readonly requestFingerprint: string;
};

export type MutationOperationRecord = MutationOperationBase & {
  readonly status: "pending" | "succeeded" | "failed";
  readonly outcomeCode: string | null;
  readonly resultRevision: bigint | null;
};

export type MutationOperationCompletion = {
  readonly status: "succeeded" | "failed";
  readonly outcomeCode: MutationOutcomeCode;
  readonly resultRevision: bigint;
};

type MutationOperationViewBase = Omit<
  MutationOperationBase,
  "kind" | "requestFingerprint"
>;

export type MutationOperationView = MutationOperationViewBase &
  (
    | { readonly kind: MutationOperationKind; readonly status: "pending" }
    | {
        readonly kind: MutationOperationKind;
        readonly status: "succeeded" | "failed";
        readonly outcomeCode: MutationOutcomeCode;
        readonly resultRevision: bigint;
      }
  );

export type MutationCommandResult =
  | MutationOperationView
  | { readonly status: "operation-conflict"; readonly operationId: string }
  | { readonly status: "project-not-found"; readonly projectId: ProjectId };

export type MutationOperationReadResult =
  | MutationOperationView
  | { readonly status: "operation-conflict"; readonly operationId: string }
  | { readonly status: "not-found" };

export type ProjectMutationQueries = {
  readOperation(operationId: string): Promise<MutationOperationRecord | null>;
  lockOperation(operationId: string): Promise<MutationOperationRecord | null>;
  insertOperation(operation: MutationOperationRecord): Promise<boolean>;
  completeOperation(
    operationId: string,
    completion: MutationOperationCompletion,
  ): Promise<boolean>;
  projectExists(projectId: ProjectId): Promise<boolean>;
  insertProject(): Promise<ProjectId>;
  insertProjectDraft(
    projectId: ProjectId,
    draft: ProjectVersion,
  ): Promise<void>;
  lockProjectRevision(projectId: ProjectId): Promise<bigint | null>;
  updateProjectDraft(
    projectId: ProjectId,
    expectedRevision: bigint,
    draft: ProjectVersion,
  ): Promise<bigint | null>;
  lockFeaturedDraft(): Promise<{
    readonly revision: bigint;
    readonly slots: DraftFeaturedSlots;
  }>;
  countProjects(projectIds: readonly ProjectId[]): Promise<number>;
  updateFeaturedDraft(
    expectedRevision: bigint,
    slots: DraftFeaturedSlots,
  ): Promise<bigint | null>;
};

export type ProjectMutationService = {
  createProjectDraft(command: {
    readonly operationId: string;
    readonly draft: ProjectVersion;
  }): Promise<MutationCommandResult>;
  saveProjectDraft(command: {
    readonly operationId: string;
    readonly projectId: ProjectId;
    readonly expectedRevision: bigint;
    readonly draft: ProjectVersion;
  }): Promise<MutationCommandResult>;
  saveDraftFeatured(command: {
    readonly operationId: string;
    readonly expectedRevision: bigint;
    readonly slots: DraftFeaturedSlots;
  }): Promise<MutationCommandResult>;
  readMutationOperation(
    operationId: string,
  ): Promise<MutationOperationReadResult>;
};

export class ProjectMutationConsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectMutationConsistencyError";
  }
}

class ConcurrentCreateOperationError extends Error {}

function normalizedDraft(draft: ProjectVersion) {
  return {
    number: draft.number,
    name: draft.name,
    category: draft.category,
    description: draft.description,
    role: draft.role ?? null,
    tech: [...draft.tech],
    repo: draft.repo ?? null,
    liveUrl: draft.liveUrl ?? null,
    slug: draft.slug,
    longDescriptionMarkdown: draft.longDescriptionMarkdown ?? null,
    groupOrder: draft.groupOrder,
  };
}

function fingerprint(intent: unknown): string {
  return createHash("sha256").update(JSON.stringify(intent)).digest("hex");
}

function operationView(
  operation: MutationOperationRecord,
): MutationOperationView {
  if (operation.kind === "publish" || operation.kind === "save_content_draft") {
    throw new ProjectMutationConsistencyError(
      "Publication operation cannot be exposed as a draft mutation",
    );
  }
  const base = {
    operationId: operation.operationId,
    kind: operation.kind,
    projectId: operation.projectId,
  };

  return operation.status === "pending"
    ? { ...base, status: "pending" }
    : terminalOperationView(base, operation);
}

function terminalOperationView(
  base: MutationOperationViewBase & { readonly kind: MutationOperationKind },
  operation: MutationOperationRecord,
): MutationOperationView {
  const allowedOutcomeCodes: readonly string[] = [
    "project_draft_created",
    "project_draft_saved",
    "featured_draft_saved",
    "stale_revision",
    "invalid_featured_reference",
  ];
  if (
    operation.outcomeCode === null ||
    !allowedOutcomeCodes.includes(operation.outcomeCode) ||
    operation.resultRevision === null
  ) {
    throw new ProjectMutationConsistencyError(
      "Terminal draft mutation operation has an invalid persisted outcome",
    );
  }

  return {
    ...base,
    status: operation.status,
    outcomeCode: operation.outcomeCode as MutationOutcomeCode,
    resultRevision: operation.resultRevision,
  };
}

function conflict(operationId: string): MutationCommandResult {
  return { status: "operation-conflict", operationId };
}

function matchesOperation(
  operation: MutationOperationRecord,
  expected: {
    kind: MutationOperationKind;
    projectId?: ProjectId | null;
    requestFingerprint: string;
  },
): boolean {
  return (
    operation.kind === expected.kind &&
    operation.requestFingerprint === expected.requestFingerprint &&
    (expected.projectId === undefined ||
      operation.projectId === expected.projectId)
  );
}

function resolvedOperation(
  operation: MutationOperationRecord,
  expected: {
    kind: MutationOperationKind;
    projectId?: ProjectId | null;
    requestFingerprint: string;
  },
): MutationCommandResult {
  return matchesOperation(operation, expected)
    ? operationView(operation)
    : conflict(operation.operationId);
}

function pendingOperation(input: {
  operationId: string;
  kind: MutationOperationKind;
  projectId: ProjectId | null;
  requestFingerprint: string;
}): MutationOperationRecord {
  return {
    ...input,
    status: "pending",
    outcomeCode: null,
    resultRevision: null,
  };
}

/**
 * Coordinates durable operation claims and one-shot mutation execution.
 * Callers must recover uncertain outcomes through readMutationOperation;
 * mutation commands deliberately never retry pending operations.
 */
export function createProjectMutationService<Session>(
  sessions: TransactionSessionBoundary<Session>,
  createQueries: (session: Session) => ProjectMutationQueries,
): ProjectMutationService {
  async function completeOperation(
    queries: ProjectMutationQueries,
    operationId: string,
    completion: MutationOperationCompletion,
  ): Promise<MutationOperationView> {
    if (!(await queries.completeOperation(operationId, completion))) {
      throw new ProjectMutationConsistencyError(
        "Pending Project mutation operation could not be completed",
      );
    }
    const operation = await queries.readOperation(operationId);
    if (operation === null) {
      throw new ProjectMutationConsistencyError(
        "Completed Project mutation operation could not be read",
      );
    }
    return operationView(operation);
  }

  return {
    createProjectDraft: async ({ operationId, draft }) => {
      const requestFingerprint = fingerprint({
        action: "create_project_draft",
        draft: normalizedDraft(draft),
      });
      const expected = {
        kind: "save_project_draft" as const,
        requestFingerprint,
      };

      try {
        return await sessions.withTransaction(async (session) => {
          const queries = createQueries(session);
          const existing = await queries.readOperation(operationId);
          if (existing !== null) {
            return resolvedOperation(existing, expected);
          }

          const projectId = await queries.insertProject();
          await queries.insertProjectDraft(projectId, draft);
          const operation: MutationOperationRecord = {
            operationId,
            kind: "save_project_draft",
            projectId,
            requestFingerprint,
            status: "succeeded",
            outcomeCode: "project_draft_created",
            resultRevision: 1n,
          };

          if (!(await queries.insertOperation(operation))) {
            throw new ConcurrentCreateOperationError();
          }
          return operationView(operation);
        });
      } catch (error) {
        if (!(error instanceof ConcurrentCreateOperationError)) throw error;

        return sessions.withTransaction(async (session) => {
          const existing =
            await createQueries(session).readOperation(operationId);
          if (existing === null) {
            throw new ProjectMutationConsistencyError(
              "Conflicting create operation could not be read",
            );
          }
          return resolvedOperation(existing, expected);
        });
      }
    },

    saveProjectDraft: async ({
      operationId,
      projectId,
      expectedRevision,
      draft,
    }) => {
      const requestFingerprint = fingerprint({
        action: "save_project_draft",
        projectId,
        expectedRevision: expectedRevision.toString(),
        draft: normalizedDraft(draft),
      });
      const expected = {
        kind: "save_project_draft" as const,
        projectId,
        requestFingerprint,
      };
      const claim = await sessions.withTransaction(async (session) => {
        const queries = createQueries(session);
        const existing = await queries.readOperation(operationId);
        if (existing !== null) return resolvedOperation(existing, expected);
        if (!(await queries.projectExists(projectId))) {
          return { status: "project-not-found" as const, projectId };
        }

        const operation = pendingOperation({
          operationId,
          kind: "save_project_draft",
          projectId,
          requestFingerprint,
        });
        if (await queries.insertOperation(operation))
          return { status: "claimed" as const };

        const racedOperation = await queries.readOperation(operationId);
        if (racedOperation === null) {
          throw new ProjectMutationConsistencyError(
            "Conflicting Project save operation could not be read",
          );
        }
        return resolvedOperation(racedOperation, expected);
      });
      if (claim.status !== "claimed") return claim;

      return sessions.withTransaction(async (session) => {
        const queries = createQueries(session);
        const operation = await queries.lockOperation(operationId);
        if (operation === null) {
          throw new ProjectMutationConsistencyError(
            "Claimed Project save operation is missing",
          );
        }
        if (!matchesOperation(operation, expected))
          return conflict(operationId);
        if (operation.status !== "pending") return operationView(operation);

        const currentRevision = await queries.lockProjectRevision(projectId);
        if (currentRevision === null) {
          throw new ProjectMutationConsistencyError(
            "Claimed Project save target is missing",
          );
        }
        if (currentRevision !== expectedRevision) {
          return completeOperation(queries, operationId, {
            status: "failed",
            outcomeCode: "stale_revision",
            resultRevision: currentRevision,
          });
        }

        const resultRevision = await queries.updateProjectDraft(
          projectId,
          expectedRevision,
          draft,
        );
        if (resultRevision === null) {
          throw new ProjectMutationConsistencyError(
            "Locked Project draft revision changed unexpectedly",
          );
        }
        return completeOperation(queries, operationId, {
          status: "succeeded",
          outcomeCode: "project_draft_saved",
          resultRevision,
        });
      });
    },

    saveDraftFeatured: async ({ operationId, expectedRevision, slots }) => {
      const requestFingerprint = fingerprint({
        action: "save_featured_draft",
        expectedRevision: expectedRevision.toString(),
        slots: [...slots],
      });
      const expected = {
        kind: "save_featured_draft" as const,
        projectId: null,
        requestFingerprint,
      };
      const claim = await sessions.withTransaction(async (session) => {
        const queries = createQueries(session);
        const existing = await queries.readOperation(operationId);
        if (existing !== null) return resolvedOperation(existing, expected);

        const operation = pendingOperation({
          operationId,
          kind: "save_featured_draft",
          projectId: null,
          requestFingerprint,
        });
        if (await queries.insertOperation(operation))
          return { status: "claimed" as const };

        const racedOperation = await queries.readOperation(operationId);
        if (racedOperation === null) {
          throw new ProjectMutationConsistencyError(
            "Conflicting featured save operation could not be read",
          );
        }
        return resolvedOperation(racedOperation, expected);
      });
      if (claim.status !== "claimed") return claim;

      return sessions.withTransaction(async (session) => {
        const queries = createQueries(session);
        const operation = await queries.lockOperation(operationId);
        if (operation === null) {
          throw new ProjectMutationConsistencyError(
            "Claimed featured save operation is missing",
          );
        }
        if (!matchesOperation(operation, expected))
          return conflict(operationId);
        if (operation.status !== "pending") return operationView(operation);

        const featured = await queries.lockFeaturedDraft();
        if (featured.revision !== expectedRevision) {
          return completeOperation(queries, operationId, {
            status: "failed",
            outcomeCode: "stale_revision",
            resultRevision: featured.revision,
          });
        }

        const referencedProjectIds = [
          ...new Set(slots.filter((id) => id !== null)),
        ];
        if (
          (await queries.countProjects(referencedProjectIds)) !==
          referencedProjectIds.length
        ) {
          return completeOperation(queries, operationId, {
            status: "failed",
            outcomeCode: "invalid_featured_reference",
            resultRevision: featured.revision,
          });
        }

        const resultRevision = await queries.updateFeaturedDraft(
          expectedRevision,
          slots,
        );
        if (resultRevision === null) {
          throw new ProjectMutationConsistencyError(
            "Locked featured draft revision changed unexpectedly",
          );
        }
        return completeOperation(queries, operationId, {
          status: "succeeded",
          outcomeCode: "featured_draft_saved",
          resultRevision,
        });
      });
    },

    readMutationOperation: (operationId) =>
      sessions.withTransaction(async (session) => {
        const operation =
          await createQueries(session).readOperation(operationId);
        return operation === null
          ? { status: "not-found" as const }
          : operation.kind === "publish" ||
              operation.kind === "save_content_draft"
            ? { status: "operation-conflict" as const, operationId }
            : operationView(operation);
      }),
  };
}
