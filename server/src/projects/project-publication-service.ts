import { createHash } from "node:crypto";

import type { TransactionSessionBoundary } from "../db/database-session.ts";
import {
  parseContentDocument,
  type ContentDocument,
  type ContentSectionKey,
} from "../content/content-contract.ts";
import {
  projectPublishCandidateSchema,
  type ProjectGallery,
  type ProjectId,
  type ProjectPublishCandidate,
  type ProjectRecord,
} from "./project-contract.ts";
import type { MutationOperationRecord } from "./project-mutation-service.ts";

const PUBLISH_FINGERPRINT = createHash("sha256")
  .update(JSON.stringify({ action: "publish_updates" }))
  .digest("hex");

export type PublicationOutcomeCode = "published" | "publish_not_ready";

export type PublicationOperationView =
  | {
      readonly operationId: string;
      readonly kind: "publish";
      readonly status: "pending";
    }
  | {
      readonly operationId: string;
      readonly kind: "publish";
      readonly status: "succeeded";
      readonly outcomeCode: "published";
      readonly snapshotRevision: bigint;
    }
  | {
      readonly operationId: string;
      readonly kind: "publish";
      readonly status: "failed";
      readonly outcomeCode: "publish_not_ready";
    };

export type PublicationCommandResult =
  | PublicationOperationView
  | { readonly operationId: string; readonly status: "operation-conflict" };

export type PublicationOperationReadResult =
  PublicationCommandResult | { readonly status: "not-found" };

export type PublicationCandidateState = {
  readonly projects: readonly ProjectRecord[];
  readonly featuredProjectIds: readonly [
    ProjectId | null,
    ProjectId | null,
    ProjectId | null,
  ];
  readonly reservedSlugs: readonly {
    readonly projectId: ProjectId;
    readonly slug: string;
  }[];
  readonly snapshotRevision: bigint | null;
  readonly contentSections?: readonly {
    readonly sectionKey: ContentSectionKey;
    readonly document: ContentDocument;
  }[];
  readonly projectGalleries?: readonly {
    readonly projectId: ProjectId;
    readonly gallery: ProjectGallery;
  }[];
  readonly galleryAssetsReady?: boolean;
  readonly contentMediaReady?: boolean;
};

export type ProjectPublicationQueries = {
  readOperation(operationId: string): Promise<MutationOperationRecord | null>;
  lockOperation(operationId: string): Promise<MutationOperationRecord | null>;
  insertOperation(operation: MutationOperationRecord): Promise<boolean>;
  completeOperation(
    operationId: string,
    completion: {
      readonly status: "succeeded" | "failed";
      readonly outcomeCode: PublicationOutcomeCode;
      readonly resultRevision: bigint | null;
    },
  ): Promise<boolean>;
  lockCandidate(): Promise<PublicationCandidateState>;
  publishSnapshot(input: {
    readonly candidate: ProjectPublishCandidate;
    readonly contentSections: readonly {
      readonly sectionKey: ContentSectionKey;
      readonly document: ContentDocument;
    }[];
    readonly projectGalleries?: readonly {
      readonly projectId: ProjectId;
      readonly gallery: ProjectGallery;
    }[];
    readonly operationId: string;
    readonly snapshotRevision: bigint;
  }): Promise<void>;
};

export type ProjectPublicationService = {
  publishUpdates(command: {
    readonly operationId: string;
  }): Promise<PublicationCommandResult>;
  readPublicationOperation(
    operationId: string,
  ): Promise<PublicationOperationReadResult>;
};

export class ProjectPublicationConsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProjectPublicationConsistencyError";
  }
}

function matchesPublication(operation: MutationOperationRecord): boolean {
  return (
    operation.kind === "publish" &&
    operation.projectId === null &&
    operation.requestFingerprint === PUBLISH_FINGERPRINT
  );
}

function operationView(
  operation: MutationOperationRecord,
): PublicationOperationView {
  if (!matchesPublication(operation)) {
    throw new ProjectPublicationConsistencyError(
      "Draft mutation operation cannot be exposed as a publication",
    );
  }
  if (operation.status === "pending") {
    return {
      operationId: operation.operationId,
      kind: "publish",
      status: "pending",
    };
  }
  if (
    operation.status === "succeeded" &&
    operation.outcomeCode === "published" &&
    operation.resultRevision !== null
  ) {
    return {
      operationId: operation.operationId,
      kind: "publish",
      status: "succeeded",
      outcomeCode: "published",
      snapshotRevision: operation.resultRevision,
    };
  }
  if (
    operation.status === "failed" &&
    operation.outcomeCode === "publish_not_ready" &&
    operation.resultRevision === null
  ) {
    return {
      operationId: operation.operationId,
      kind: "publish",
      status: "failed",
      outcomeCode: "publish_not_ready",
    };
  }
  throw new ProjectPublicationConsistencyError(
    "Publication operation has an invalid persisted outcome",
  );
}

function conflict(operationId: string): PublicationCommandResult {
  return { operationId, status: "operation-conflict" };
}

function resolveOperation(
  operation: MutationOperationRecord,
): PublicationCommandResult {
  return matchesPublication(operation)
    ? operationView(operation)
    : conflict(operation.operationId);
}

function validateCandidate(state: PublicationCandidateState): {
  readonly candidate: ProjectPublishCandidate;
  readonly contentSections: readonly {
    readonly sectionKey: ContentSectionKey;
    readonly document: ContentDocument;
  }[];
  readonly projectGalleries: readonly {
    readonly projectId: ProjectId;
    readonly gallery: ProjectGallery;
  }[];
} | null {
  const parsed = projectPublishCandidateSchema.safeParse({
    projects: state.projects,
    featuredProjectIds: state.featuredProjectIds,
  });
  if (!parsed.success) return null;

  const included = parsed.data.projects.filter(
    (project) =>
      project.lifecycle === "active" && project.publicationIntent === "include",
  );
  if (
    included.some(
      (project) =>
        project.draft.repo === undefined && project.draft.liveUrl === undefined,
    )
  ) {
    return null;
  }

  const reservations = new Map(
    state.reservedSlugs.map((reservation) => [
      reservation.slug,
      reservation.projectId,
    ]),
  );
  if (
    included.some((project) => {
      const owner = reservations.get(project.draft.slug);
      return owner !== undefined && owner !== project.id;
    })
  ) {
    return null;
  }

  const contentSections = state.contentSections ?? [];
  const projectGalleries = state.projectGalleries ?? [];
  const includedIds = new Set(included.map(({ id }) => id));
  if (
    state.galleryAssetsReady === false ||
    state.contentMediaReady === false ||
    projectGalleries.some(({ projectId }) => !includedIds.has(projectId))
  ) {
    return null;
  }
  try {
    return {
      candidate: parsed.data,
      contentSections: contentSections.map(({ sectionKey, document }) => ({
        sectionKey,
        document: parseContentDocument(sectionKey, document),
      })),
      projectGalleries,
    };
  } catch {
    return null;
  }
}

/**
 * Claims one durable publication intent, then executes it once at SERIALIZABLE
 * isolation. Unknown failures remain pending for read-only reconciliation.
 */
export function createProjectPublicationService<Session>(
  sessions: TransactionSessionBoundary<Session>,
  createQueries: (session: Session) => ProjectPublicationQueries,
): ProjectPublicationService {
  async function complete(
    queries: ProjectPublicationQueries,
    operationId: string,
    completion: {
      readonly status: "succeeded" | "failed";
      readonly outcomeCode: PublicationOutcomeCode;
      readonly resultRevision: bigint | null;
    },
  ): Promise<PublicationOperationView> {
    if (!(await queries.completeOperation(operationId, completion))) {
      throw new ProjectPublicationConsistencyError(
        "Pending publication operation could not be completed",
      );
    }
    const operation = await queries.readOperation(operationId);
    if (operation === null) {
      throw new ProjectPublicationConsistencyError(
        "Completed publication operation could not be read",
      );
    }
    return operationView(operation);
  }

  return {
    publishUpdates: async ({ operationId }) => {
      const claim = await sessions.withTransaction(async (session) => {
        const queries = createQueries(session);
        const existing = await queries.readOperation(operationId);
        if (existing !== null) return resolveOperation(existing);

        const operation: MutationOperationRecord = {
          operationId,
          kind: "publish",
          projectId: null,
          requestFingerprint: PUBLISH_FINGERPRINT,
          status: "pending",
          outcomeCode: null,
          resultRevision: null,
        };
        if (await queries.insertOperation(operation)) {
          return { status: "claimed" as const };
        }
        const raced = await queries.readOperation(operationId);
        if (raced === null) {
          throw new ProjectPublicationConsistencyError(
            "Conflicting publication operation could not be read",
          );
        }
        return resolveOperation(raced);
      });
      if (claim.status !== "claimed") return claim;

      return sessions.withTransaction(
        async (session) => {
          const queries = createQueries(session);
          const operation = await queries.lockOperation(operationId);
          if (operation === null) {
            throw new ProjectPublicationConsistencyError(
              "Claimed publication operation is missing",
            );
          }
          if (!matchesPublication(operation)) return conflict(operationId);
          if (operation.status !== "pending") return operationView(operation);

          const state = await queries.lockCandidate();
          const publication = validateCandidate(state);
          if (publication === null) {
            return complete(queries, operationId, {
              status: "failed",
              outcomeCode: "publish_not_ready",
              resultRevision: null,
            });
          }

          const snapshotRevision = (state.snapshotRevision ?? 0n) + 1n;
          await queries.publishSnapshot({
            candidate: publication.candidate,
            contentSections: publication.contentSections,
            projectGalleries: publication.projectGalleries,
            operationId,
            snapshotRevision,
          });
          return complete(queries, operationId, {
            status: "succeeded",
            outcomeCode: "published",
            resultRevision: snapshotRevision,
          });
        },
        { isolationLevel: "serializable" },
      );
    },

    readPublicationOperation: (operationId) =>
      sessions.withTransaction(async (session) => {
        const operation =
          await createQueries(session).readOperation(operationId);
        return operation === null
          ? { status: "not-found" as const }
          : resolveOperation(operation);
      }),
  };
}
