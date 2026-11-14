import { and, asc, eq, inArray } from "drizzle-orm";

import type {
  ProjectDatabaseTransaction,
  TransactionSessionBoundary,
} from "../db/database-session.ts";
import {
  contentSectionDrafts,
  draftFeaturedState,
  draftProjectMedia,
  mediaAssets,
  projectDrafts,
  projectOperations,
  projects,
  publishedProjects,
  publishedProjectMedia,
  publishedContentSections,
  publishedSlugs,
  publishedState,
} from "../db/schema/project-schema.ts";
import { parseContentDocument } from "../content/content-contract.ts";
import type {
  ProjectGallery,
  ProjectId,
  ProjectRecord,
  ProjectVersion,
} from "./project-contract.ts";
import {
  createProjectPublicationService,
  ProjectPublicationConsistencyError,
  type ProjectPublicationQueries,
  type ProjectPublicationService,
} from "./project-publication-service.ts";
import type { MutationOperationRecord } from "./project-mutation-service.ts";

const operationSelection = {
  operationId: projectOperations.operationId,
  kind: projectOperations.kind,
  projectId: projectOperations.projectId,
  requestFingerprint: projectOperations.requestFingerprint,
  status: projectOperations.status,
  outcomeCode: projectOperations.outcomeCode,
  resultRevision: projectOperations.resultRevision,
};

function toOperationRecord(
  row: Pick<
    typeof projectOperations.$inferSelect,
    | "operationId"
    | "kind"
    | "projectId"
    | "requestFingerprint"
    | "status"
    | "outcomeCode"
    | "resultRevision"
  >,
): MutationOperationRecord {
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

function versionFromRow(row: {
  readonly number: string;
  readonly name: string;
  readonly category: ProjectVersion["category"];
  readonly description: string;
  readonly role: string | null;
  readonly tech: string[];
  readonly repo: string | null;
  readonly liveUrl: string | null;
  readonly slug: string;
  readonly longDescriptionMarkdown: string | null;
  readonly groupOrder: number;
}): ProjectVersion {
  return {
    number: row.number,
    name: row.name,
    category: row.category,
    description: row.description,
    ...(row.role === null ? {} : { role: row.role }),
    tech: row.tech,
    ...(row.repo === null ? {} : { repo: row.repo }),
    ...(row.liveUrl === null ? {} : { liveUrl: row.liveUrl }),
    slug: row.slug,
    ...(row.longDescriptionMarkdown === null
      ? {}
      : { longDescriptionMarkdown: row.longDescriptionMarkdown }),
    groupOrder: row.groupOrder,
  };
}

function publishedValues(project: ProjectRecord) {
  const draft = project.draft;
  return {
    projectId: project.id,
    number: draft.number,
    name: draft.name,
    category: draft.category,
    description: draft.description,
    role: draft.role ?? null,
    tech: [...draft.tech],
    repo: draft.repo ?? null,
    liveUrl: draft.liveUrl ?? null,
    longDescriptionMarkdown: draft.longDescriptionMarkdown ?? null,
    groupOrder: draft.groupOrder,
  };
}

/** Creates publication persistence queries over one injected transaction. */
export function createDrizzleProjectPublicationQueries(
  session: ProjectDatabaseTransaction,
): ProjectPublicationQueries {
  return {
    readOperation: (operationId) => readOperation(session, operationId, false),
    lockOperation: (operationId) => readOperation(session, operationId, true),
    insertOperation: async (operation) => {
      const rows = await session
        .insert(projectOperations)
        .values(operation)
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
    lockCandidate: async () => {
      const featuredRows = await session
        .select({
          slot1ProjectId: draftFeaturedState.slot1ProjectId,
          slot2ProjectId: draftFeaturedState.slot2ProjectId,
          slot3ProjectId: draftFeaturedState.slot3ProjectId,
        })
        .from(draftFeaturedState)
        .where(eq(draftFeaturedState.singletonId, 1))
        .limit(1)
        .for("update");
      const featured = featuredRows[0];
      if (featured === undefined) {
        throw new ProjectPublicationConsistencyError(
          "Draft featured singleton is missing",
        );
      }

      const projectRows = await session
        .select({
          id: projects.id,
          lifecycle: projects.lifecycle,
          publicationIntent: projects.publicationIntent,
          number: projectDrafts.number,
          name: projectDrafts.name,
          category: projectDrafts.category,
          description: projectDrafts.description,
          role: projectDrafts.role,
          tech: projectDrafts.tech,
          repo: projectDrafts.repo,
          liveUrl: projectDrafts.liveUrl,
          slug: projectDrafts.slug,
          longDescriptionMarkdown: projectDrafts.longDescriptionMarkdown,
          groupOrder: projectDrafts.groupOrder,
        })
        .from(projects)
        .innerJoin(projectDrafts, eq(projectDrafts.projectId, projects.id))
        .orderBy(asc(projects.id))
        .for("update");
      const snapshotRows = await session
        .select({ snapshotRevision: publishedState.snapshotRevision })
        .from(publishedState)
        .where(eq(publishedState.singletonId, 1))
        .limit(1)
        .for("update");
      const slugRows = await session
        .select({
          slug: publishedSlugs.slug,
          projectId: publishedSlugs.projectId,
        })
        .from(publishedSlugs)
        .orderBy(asc(publishedSlugs.slug))
        .for("update");
      const contentRows = await session
        .select({
          sectionKey: contentSectionDrafts.sectionKey,
          document: contentSectionDrafts.document,
        })
        .from(contentSectionDrafts)
        .orderBy(asc(contentSectionDrafts.sectionKey))
        .for("update");
      const galleryRows = await session
        .select({
          projectId: draftProjectMedia.projectId,
          mediaId: draftProjectMedia.mediaId,
          altText: draftProjectMedia.altText,
          isCover: draftProjectMedia.isCover,
          status: mediaAssets.status,
        })
        .from(draftProjectMedia)
        .innerJoin(mediaAssets, eq(mediaAssets.id, draftProjectMedia.mediaId))
        .orderBy(
          asc(draftProjectMedia.projectId),
          asc(draftProjectMedia.position),
        )
        .for("update");
      const mediaDocument = contentRows.find(
        ({ sectionKey }) => sectionKey === "media-resume",
      )?.document as
        | { profileImageMediaId?: string | null; resumeMediaId?: string | null }
        | undefined;
      const contentMediaIds = [
        mediaDocument?.profileImageMediaId,
        mediaDocument?.resumeMediaId,
      ].filter((value): value is string => typeof value === "string");
      const contentMediaRows =
        contentMediaIds.length === 0
          ? []
          : await session
              .select({
                id: mediaAssets.id,
                kind: mediaAssets.kind,
                status: mediaAssets.status,
              })
              .from(mediaAssets)
              .where(inArray(mediaAssets.id, contentMediaIds))
              .for("update");
      const projectGalleries = new Map<ProjectId, ProjectGallery>();
      for (const row of galleryRows) {
        const gallery = projectGalleries.get(row.projectId) ?? [];
        projectGalleries.set(row.projectId, [
          ...gallery,
          {
            mediaId: row.mediaId,
            altText: row.altText,
            isCover: row.isCover,
          },
        ]);
      }

      return {
        featuredProjectIds: [
          featured.slot1ProjectId,
          featured.slot2ProjectId,
          featured.slot3ProjectId,
        ],
        projects: projectRows.map((row) => ({
          id: row.id,
          lifecycle: row.lifecycle,
          publicationIntent: row.publicationIntent,
          draft: versionFromRow(row),
          published: null,
        })),
        reservedSlugs: slugRows,
        snapshotRevision: snapshotRows[0]?.snapshotRevision ?? null,
        contentSections: contentRows.map((row) => ({
          sectionKey: row.sectionKey,
          document: parseContentDocument(row.sectionKey, row.document),
        })),
        projectGalleries: [...projectGalleries].map(([projectId, gallery]) => ({
          projectId,
          gallery,
        })),
        galleryAssetsReady: galleryRows.every(
          ({ status }) => status === "ready",
        ),
        contentMediaReady:
          contentMediaRows.length === contentMediaIds.length &&
          contentMediaRows.every(({ id, kind, status }) => {
            if (status !== "ready") return false;
            if (id === mediaDocument?.profileImageMediaId)
              return kind === "image";
            if (id === mediaDocument?.resumeMediaId)
              return kind === "resume_pdf";
            return false;
          }),
      };
    },
    publishSnapshot: async ({
      candidate,
      contentSections,
      projectGalleries = [],
      operationId,
      snapshotRevision,
    }) => {
      const included = candidate.projects.filter(
        (project) =>
          project.lifecycle === "active" &&
          project.publicationIntent === "include",
      );
      const includedIds = included.map((project) => project.id);

      await session.delete(publishedState);
      await session.delete(publishedContentSections);
      await session.delete(publishedProjectMedia);
      await session.delete(publishedProjects);
      if (included.length > 0) {
        await session
          .insert(publishedProjects)
          .values(included.map(publishedValues));
      }
      if (contentSections.length > 0) {
        await session
          .insert(publishedContentSections)
          .values([...contentSections]);
      }
      const publishedGalleryRows = projectGalleries.flatMap(
        ({ projectId, gallery }) =>
          gallery.map((item, index) => ({
            projectId,
            mediaId: item.mediaId,
            position: index + 1,
            altText: item.altText,
            isCover: item.isCover,
          })),
      );
      if (publishedGalleryRows.length > 0) {
        await session
          .insert(publishedProjectMedia)
          .values(publishedGalleryRows);
      }
      if (includedIds.length > 0) {
        await session
          .update(publishedSlugs)
          .set({ kind: "redirect" })
          .where(
            and(
              inArray(publishedSlugs.projectId, includedIds),
              eq(publishedSlugs.kind, "current"),
            ),
          );
      }
      for (const project of included) {
        await session
          .insert(publishedSlugs)
          .values({
            slug: project.draft.slug,
            projectId: project.id,
            kind: "current",
          })
          .onConflictDoUpdate({
            target: publishedSlugs.slug,
            set: { projectId: project.id, kind: "current" },
          });
      }
      await session.insert(publishedState).values({
        singletonId: 1,
        snapshotRevision,
        operationId,
        slot1ProjectId: candidate.featuredProjectIds[0],
        slot2ProjectId: candidate.featuredProjectIds[1],
        slot3ProjectId: candidate.featuredProjectIds[2],
      });
    },
  };
}

/** Creates the publication service over injected read-write transactions. */
export function createDrizzleProjectPublicationService(
  sessions: TransactionSessionBoundary<ProjectDatabaseTransaction>,
): ProjectPublicationService {
  return createProjectPublicationService(
    sessions,
    createDrizzleProjectPublicationQueries,
  );
}
