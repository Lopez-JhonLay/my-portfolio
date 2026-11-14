import { and, asc, eq, sql } from "drizzle-orm";

import type {
  ProjectDatabaseTransaction,
  SnapshotConsistentSessionBoundary,
  TransactionSessionBoundary,
} from "../db/database-session.ts";
import {
  contentSectionDrafts,
  projectOperations,
  publishedContentSections,
} from "../db/schema/project-schema.ts";
import {
  parseContentDocument,
  type ContentSectionKey,
  type ContentSectionRecord,
} from "./content-contract.ts";
import {
  createContentMutationService,
  type ContentMutationQueries,
  type ContentMutationService,
  type ContentOperationLookup,
} from "./content-service.ts";

export type AdminContentSection = ContentSectionRecord & {
  readonly isPublished: boolean;
};

export type AdminContentReadRepository = {
  list(): Promise<readonly AdminContentSection[]>;
  read(sectionKey: ContentSectionKey): Promise<AdminContentSection | null>;
};

const operationSelection = {
  operationId: projectOperations.operationId,
  kind: projectOperations.kind,
  sectionKey: projectOperations.contentSectionKey,
  requestFingerprint: projectOperations.requestFingerprint,
  status: projectOperations.status,
  outcomeCode: projectOperations.outcomeCode,
  resultRevision: projectOperations.resultRevision,
};

async function readOperation(
  session: ProjectDatabaseTransaction,
  operationId: string,
  lock: boolean,
): Promise<ContentOperationLookup | null> {
  const query = session
    .select(operationSelection)
    .from(projectOperations)
    .where(eq(projectOperations.operationId, operationId))
    .limit(1);
  const [row] = lock ? await query.for("update") : await query;
  if (row === undefined) return null;
  if (row.kind !== "save_content_draft" || row.sectionKey === null) {
    return { operationId: row.operationId, kind: "foreign" };
  }
  return {
    operationId: row.operationId,
    kind: row.kind,
    sectionKey: row.sectionKey,
    requestFingerprint: row.requestFingerprint,
    status: row.status,
    outcomeCode: row.outcomeCode,
    resultRevision: row.resultRevision,
  };
}

export function createDrizzleContentMutationQueries(
  session: ProjectDatabaseTransaction,
): ContentMutationQueries {
  return {
    readOperation: (operationId) => readOperation(session, operationId, false),
    lockOperation: (operationId) => readOperation(session, operationId, true),
    insertOperation: async (operation) => {
      const rows = await session
        .insert(projectOperations)
        .values({
          operationId: operation.operationId,
          kind: operation.kind,
          projectId: null,
          contentSectionKey: operation.sectionKey,
          requestFingerprint: operation.requestFingerprint,
          status: operation.status,
          outcomeCode: operation.outcomeCode,
          resultRevision: operation.resultRevision,
        })
        .onConflictDoNothing({ target: projectOperations.operationId })
        .returning({ operationId: projectOperations.operationId });
      return rows.length === 1;
    },
    completeOperation: async (operationId, completion) => {
      const rows = await session
        .update(projectOperations)
        .set({ ...completion, completedAt: new Date() })
        .where(
          and(
            eq(projectOperations.operationId, operationId),
            eq(projectOperations.status, "pending"),
          ),
        )
        .returning({ operationId: projectOperations.operationId });
      return rows.length === 1;
    },
    lockSection: async (sectionKey) => {
      const [row] = await session
        .select()
        .from(contentSectionDrafts)
        .where(eq(contentSectionDrafts.sectionKey, sectionKey))
        .limit(1)
        .for("update");
      return row === undefined
        ? null
        : {
            sectionKey: row.sectionKey,
            revision: row.revision,
            document: parseContentDocument(row.sectionKey, row.document),
          };
    },
    updateSection: async (sectionKey, expectedRevision, document) => {
      const [row] = await session
        .update(contentSectionDrafts)
        .set({
          document,
          revision: sql`${contentSectionDrafts.revision} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(contentSectionDrafts.sectionKey, sectionKey),
            eq(contentSectionDrafts.revision, expectedRevision),
          ),
        )
        .returning({ revision: contentSectionDrafts.revision });
      return row?.revision ?? null;
    },
  };
}

function mapAdminSection(row: {
  sectionKey: ContentSectionKey;
  document: unknown;
  revision: bigint;
  publishedSectionKey: ContentSectionKey | null;
}): AdminContentSection {
  return {
    sectionKey: row.sectionKey,
    document: parseContentDocument(row.sectionKey, row.document),
    revision: row.revision,
    isPublished: row.publishedSectionKey !== null,
  };
}

export function createDrizzleAdminContentReadRepository(
  sessions: SnapshotConsistentSessionBoundary<ProjectDatabaseTransaction>,
): AdminContentReadRepository {
  const selection = {
    sectionKey: contentSectionDrafts.sectionKey,
    document: contentSectionDrafts.document,
    revision: contentSectionDrafts.revision,
    publishedSectionKey: publishedContentSections.sectionKey,
  };
  return {
    list: () =>
      sessions.withSnapshot(async (session) =>
        (
          await session
            .select(selection)
            .from(contentSectionDrafts)
            .leftJoin(
              publishedContentSections,
              eq(
                publishedContentSections.sectionKey,
                contentSectionDrafts.sectionKey,
              ),
            )
            .orderBy(asc(contentSectionDrafts.sectionKey))
        ).map(mapAdminSection),
      ),
    read: (sectionKey) =>
      sessions.withSnapshot(async (session) => {
        const [row] = await session
          .select(selection)
          .from(contentSectionDrafts)
          .leftJoin(
            publishedContentSections,
            eq(
              publishedContentSections.sectionKey,
              contentSectionDrafts.sectionKey,
            ),
          )
          .where(eq(contentSectionDrafts.sectionKey, sectionKey))
          .limit(1);
        return row === undefined ? null : mapAdminSection(row);
      }),
  };
}

export function createDrizzleContentMutationService(
  sessions: TransactionSessionBoundary<ProjectDatabaseTransaction>,
): ContentMutationService {
  return createContentMutationService(
    sessions,
    createDrizzleContentMutationQueries,
  );
}
