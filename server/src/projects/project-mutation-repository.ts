import { and, count, eq, inArray, sql } from "drizzle-orm";

import type {
  ProjectDatabaseTransaction,
  TransactionSessionBoundary,
} from "../db/database-session.ts";
import {
  draftFeaturedState,
  projectDrafts,
  projectOperations,
  projects,
} from "../db/schema/project-schema.ts";
import type { ProjectVersion } from "./project-contract.ts";
import {
  createProjectMutationService,
  ProjectMutationConsistencyError,
  type MutationOperationRecord,
  type ProjectMutationQueries,
  type ProjectMutationService,
} from "./project-mutation-service.ts";

function draftValues(draft: ProjectVersion) {
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

const operationSelection = {
  operationId: projectOperations.operationId,
  kind: projectOperations.kind,
  projectId: projectOperations.projectId,
  requestFingerprint: projectOperations.requestFingerprint,
  status: projectOperations.status,
  outcomeCode: projectOperations.outcomeCode,
  resultRevision: projectOperations.resultRevision,
};

type OperationQueryRow = Pick<
  typeof projectOperations.$inferSelect,
  | "operationId"
  | "kind"
  | "projectId"
  | "requestFingerprint"
  | "status"
  | "outcomeCode"
  | "resultRevision"
>;

function toOperationRecord(row: OperationQueryRow): MutationOperationRecord {
  return {
    operationId: row.operationId,
    kind: row.kind,
    projectId: row.projectId,
    requestFingerprint: row.requestFingerprint,
    status: row.status,
    outcomeCode: row.outcomeCode,
    resultRevision: row.resultRevision,
  };
}

async function readOperation(
  session: ProjectDatabaseTransaction,
  operationId: string,
  lock: boolean,
): Promise<MutationOperationRecord | null> {
  const query = session
    .select(operationSelection)
    .from(projectOperations)
    .where(eq(projectOperations.operationId, operationId))
    .limit(1);
  const rows = lock ? await query.for("update") : await query;
  const row = rows[0];

  return row === undefined ? null : toOperationRecord(row);
}

/** Creates mutation persistence queries over one injected Drizzle transaction. */
export function createDrizzleProjectMutationQueries(
  session: ProjectDatabaseTransaction,
): ProjectMutationQueries {
  return {
    readOperation: (operationId) => readOperation(session, operationId, false),
    lockOperation: (operationId) => readOperation(session, operationId, true),
    insertOperation: async (operation) => {
      const inserted = await session
        .insert(projectOperations)
        .values({
          operationId: operation.operationId,
          kind: operation.kind,
          projectId: operation.projectId,
          requestFingerprint: operation.requestFingerprint,
          status: operation.status,
          outcomeCode: operation.outcomeCode,
          resultRevision: operation.resultRevision,
          ...(operation.status === "pending"
            ? {}
            : { completedAt: new Date() }),
        })
        .onConflictDoNothing({ target: projectOperations.operationId })
        .returning({ operationId: projectOperations.operationId });

      return inserted.length === 1;
    },
    completeOperation: async (operationId, completion) => {
      const updated = await session
        .update(projectOperations)
        .set({ ...completion, completedAt: new Date() })
        .where(
          and(
            eq(projectOperations.operationId, operationId),
            eq(projectOperations.status, "pending"),
          ),
        )
        .returning({ operationId: projectOperations.operationId });

      return updated.length === 1;
    },
    projectExists: async (projectId) => {
      const rows = await session
        .select({ projectId: projects.id })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1);
      return rows.length === 1;
    },
    insertProject: async () => {
      const rows = await session
        .insert(projects)
        .values({ lifecycle: "active", publicationIntent: "include" })
        .returning({ projectId: projects.id });
      const row = rows[0];
      if (row === undefined) {
        throw new ProjectMutationConsistencyError(
          "Created Project identifier was not returned",
        );
      }
      return row.projectId;
    },
    insertProjectDraft: async (projectId, draft) => {
      await session
        .insert(projectDrafts)
        .values({ projectId, ...draftValues(draft) });
    },
    lockProjectRevision: async (projectId) => {
      const rows = await session
        .select({ revision: projects.draftRevision })
        .from(projects)
        .where(eq(projects.id, projectId))
        .limit(1)
        .for("update");
      return rows[0]?.revision ?? null;
    },
    updateProjectDraft: async (projectId, expectedRevision, draft) => {
      const drafts = await session
        .update(projectDrafts)
        .set(draftValues(draft))
        .where(eq(projectDrafts.projectId, projectId))
        .returning({ projectId: projectDrafts.projectId });
      if (drafts.length !== 1) {
        throw new ProjectMutationConsistencyError(
          "Locked Project draft row is missing",
        );
      }
      const updated = await session
        .update(projects)
        .set({
          draftRevision: sql`${projects.draftRevision} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(projects.id, projectId),
            eq(projects.draftRevision, expectedRevision),
          ),
        )
        .returning({ revision: projects.draftRevision });
      return updated[0]?.revision ?? null;
    },
    lockFeaturedDraft: async () => {
      const rows = await session
        .select({
          revision: draftFeaturedState.revision,
          slot1ProjectId: draftFeaturedState.slot1ProjectId,
          slot2ProjectId: draftFeaturedState.slot2ProjectId,
          slot3ProjectId: draftFeaturedState.slot3ProjectId,
        })
        .from(draftFeaturedState)
        .where(eq(draftFeaturedState.singletonId, 1))
        .limit(1)
        .for("update");
      const row = rows[0];
      if (row === undefined) {
        throw new ProjectMutationConsistencyError(
          "Draft featured singleton is missing",
        );
      }
      return {
        revision: row.revision,
        slots: [row.slot1ProjectId, row.slot2ProjectId, row.slot3ProjectId],
      };
    },
    countProjects: async (projectIds) => {
      if (projectIds.length === 0) return 0;
      const rows = await session
        .select({ value: count() })
        .from(projects)
        .where(inArray(projects.id, [...projectIds]));
      return rows[0]?.value ?? 0;
    },
    updateFeaturedDraft: async (expectedRevision, slots) => {
      const updated = await session
        .update(draftFeaturedState)
        .set({
          slot1ProjectId: slots[0],
          slot2ProjectId: slots[1],
          slot3ProjectId: slots[2],
          revision: sql`${draftFeaturedState.revision} + 1`,
        })
        .where(
          and(
            eq(draftFeaturedState.singletonId, 1),
            eq(draftFeaturedState.revision, expectedRevision),
          ),
        )
        .returning({ revision: draftFeaturedState.revision });
      return updated[0]?.revision ?? null;
    },
  };
}

/** Creates the mutation service over injected read-write transactions. */
export function createDrizzleProjectMutationService(
  sessions: TransactionSessionBoundary<ProjectDatabaseTransaction>,
): ProjectMutationService {
  return createProjectMutationService(
    sessions,
    createDrizzleProjectMutationQueries,
  );
}
