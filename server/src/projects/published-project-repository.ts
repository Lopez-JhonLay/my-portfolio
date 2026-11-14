import { and, asc, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type {
  ProjectDatabaseTransaction,
  SnapshotConsistentSessionBoundary,
} from "../db/database-session.ts";
import {
  publishedProjects,
  publishedProjectMedia,
  publishedSlugs,
  publishedState,
} from "../db/schema/project-schema.ts";
import type {
  ProjectGallery,
  ProjectId,
  ProjectVersion,
} from "./project-contract.ts";
import {
  mapPublicFeaturedProjects,
  mapPublicProjectDetail,
  mapPublicProjectGroups,
} from "./public-project-mapper.ts";
import type {
  PublicFeaturedProjectsDto,
  PublicProjectDetailDto,
  PublicProjectGroupsDto,
} from "./public-project-contract.ts";

export type PublishedStateRecord = {
  featuredProjectIds: readonly [ProjectId, ProjectId, ProjectId];
  snapshotRevision: bigint;
};

export type PublishedProjectRecord = {
  projectId: ProjectId;
  project: ProjectVersion;
  gallery?: ProjectGallery;
};

export type PublishedSlugRecord = {
  kind: "current" | "redirect";
  project: ProjectVersion;
  gallery?: ProjectGallery;
};

export type PublishedProjectReadQueries = {
  readPublishedState(): Promise<PublishedStateRecord | null>;
  readPublishedProjects(): Promise<readonly PublishedProjectRecord[]>;
  readPublishedProjectsByIds(
    projectIds: readonly [ProjectId, ProjectId, ProjectId],
  ): Promise<readonly PublishedProjectRecord[]>;
  readPublishedSlug(slug: string): Promise<PublishedSlugRecord | null>;
};

export type PublishedReadResult<Value> =
  | { readonly status: "available"; readonly data: Value }
  | { readonly status: "never-published" };

export type PublishedSlugReadResult =
  | PublishedReadResult<PublicProjectDetailDto>
  | { readonly status: "not-found" }
  | { readonly status: "redirect"; readonly slug: string };

export type PublishedProjectReadRepository = {
  readStatus(): Promise<
    { readonly status: "never-published" } | { readonly status: "published" }
  >;
  readGroups(): Promise<PublishedReadResult<PublicProjectGroupsDto>>;
  readFeatured(): Promise<PublishedReadResult<PublicFeaturedProjectsDto>>;
  readBySlug(slug: string): Promise<PublishedSlugReadResult>;
};

export class PublishedSnapshotConsistencyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PublishedSnapshotConsistencyError";
  }
}

const NEVER_PUBLISHED = { status: "never-published" } as const;
const currentPublishedSlugs = alias(publishedSlugs, "current_published_slugs");
const matchedPublishedSlugs = alias(publishedSlugs, "matched_published_slugs");
const publishedProjectSelection = {
  projectId: publishedProjects.projectId,
  number: publishedProjects.number,
  name: publishedProjects.name,
  category: publishedProjects.category,
  description: publishedProjects.description,
  role: publishedProjects.role,
  tech: publishedProjects.tech,
  repo: publishedProjects.repo,
  liveUrl: publishedProjects.liveUrl,
  longDescriptionMarkdown: publishedProjects.longDescriptionMarkdown,
  groupOrder: publishedProjects.groupOrder,
  slug: currentPublishedSlugs.slug,
};

type PublishedProjectQueryRow = {
  projectId: ProjectId;
  number: string;
  name: string;
  category: ProjectVersion["category"];
  description: string;
  role: string | null;
  tech: string[];
  repo: string | null;
  liveUrl: string | null;
  longDescriptionMarkdown: string | null;
  groupOrder: number;
  slug: string;
};

function toPublishedProjectRecord(
  row: PublishedProjectQueryRow,
  gallery: ProjectGallery = [],
): PublishedProjectRecord {
  return {
    projectId: row.projectId,
    project: {
      number: row.number,
      name: row.name,
      category: row.category,
      description: row.description,
      ...(row.role === null ? {} : { role: row.role }),
      tech: [...row.tech],
      ...(row.repo === null ? {} : { repo: row.repo }),
      ...(row.liveUrl === null ? {} : { liveUrl: row.liveUrl }),
      ...(row.longDescriptionMarkdown === null
        ? {}
        : { longDescriptionMarkdown: row.longDescriptionMarkdown }),
      groupOrder: row.groupOrder,
      slug: row.slug,
    },
    gallery,
  };
}

async function readPublishedGalleries(
  session: ProjectDatabaseTransaction,
  projectIds: readonly ProjectId[],
): Promise<Map<ProjectId, ProjectGallery>> {
  if (projectIds.length === 0) return new Map();
  const rows = await session
    .select({
      projectId: publishedProjectMedia.projectId,
      mediaId: publishedProjectMedia.mediaId,
      altText: publishedProjectMedia.altText,
      isCover: publishedProjectMedia.isCover,
    })
    .from(publishedProjectMedia)
    .where(inArray(publishedProjectMedia.projectId, [...projectIds]))
    .orderBy(
      asc(publishedProjectMedia.projectId),
      asc(publishedProjectMedia.position),
    );
  const galleries = new Map<ProjectId, ProjectGallery>();
  for (const projectId of projectIds) {
    galleries.set(
      projectId,
      rows
        .filter((row) => row.projectId === projectId)
        .map(({ mediaId, altText, isCover }) => ({
          mediaId,
          altText,
          isCover,
        })),
    );
  }
  return galleries;
}

function publishedProjectJoin(session: ProjectDatabaseTransaction) {
  return session
    .select(publishedProjectSelection)
    .from(publishedProjects)
    .innerJoin(
      currentPublishedSlugs,
      and(
        eq(currentPublishedSlugs.projectId, publishedProjects.projectId),
        eq(currentPublishedSlugs.kind, "current"),
      ),
    );
}

/** Builds read queries against published tables on one injected transaction. */
export function createDrizzlePublishedProjectReadQueries(
  session: ProjectDatabaseTransaction,
): PublishedProjectReadQueries {
  return {
    readPublishedState: async () => {
      const rows = await session
        .select({
          snapshotRevision: publishedState.snapshotRevision,
          slot1ProjectId: publishedState.slot1ProjectId,
          slot2ProjectId: publishedState.slot2ProjectId,
          slot3ProjectId: publishedState.slot3ProjectId,
        })
        .from(publishedState)
        .limit(1);
      const [state] = rows;

      return state === undefined
        ? null
        : {
            featuredProjectIds: [
              state.slot1ProjectId,
              state.slot2ProjectId,
              state.slot3ProjectId,
            ],
            snapshotRevision: state.snapshotRevision,
          };
    },
    readPublishedProjects: async () => {
      const rows = await publishedProjectJoin(session);
      const galleries = await readPublishedGalleries(
        session,
        rows.map(({ projectId }) => projectId),
      );
      return rows.map((row) =>
        toPublishedProjectRecord(row, galleries.get(row.projectId)),
      );
    },
    readPublishedProjectsByIds: async (projectIds) => {
      const rows = await publishedProjectJoin(session).where(
        inArray(publishedProjects.projectId, [...projectIds]),
      );
      const galleries = await readPublishedGalleries(session, projectIds);
      return rows.map((row) =>
        toPublishedProjectRecord(row, galleries.get(row.projectId)),
      );
    },
    readPublishedSlug: async (slug) => {
      const rows = await session
        .select({
          kind: matchedPublishedSlugs.kind,
          ...publishedProjectSelection,
        })
        .from(matchedPublishedSlugs)
        .innerJoin(
          publishedProjects,
          eq(publishedProjects.projectId, matchedPublishedSlugs.projectId),
        )
        .innerJoin(
          currentPublishedSlugs,
          and(
            eq(currentPublishedSlugs.projectId, publishedProjects.projectId),
            eq(currentPublishedSlugs.kind, "current"),
          ),
        )
        .where(eq(matchedPublishedSlugs.slug, slug))
        .limit(1);
      const [row] = rows;

      if (row === undefined) return null;
      const galleries = await readPublishedGalleries(session, [row.projectId]);
      const record = toPublishedProjectRecord(
        row,
        galleries.get(row.projectId),
      );
      return {
        kind: row.kind,
        project: record.project,
        gallery: record.gallery,
      };
    },
  };
}

export function createPublishedProjectReadRepository<Session>(
  sessions: SnapshotConsistentSessionBoundary<Session>,
  createQueries: (session: Session) => PublishedProjectReadQueries,
): PublishedProjectReadRepository {
  return {
    readStatus: () =>
      sessions.withSnapshot(async (session) => ({
        status:
          (await createQueries(session).readPublishedState()) === null
            ? "never-published"
            : "published",
      })),
    readGroups: () =>
      sessions.withSnapshot(async (session) => {
        const queries = createQueries(session);
        const state = await queries.readPublishedState();

        if (state === null) return NEVER_PUBLISHED;

        const records = await queries.readPublishedProjects();
        return {
          status: "available",
          data: mapPublicProjectGroups(
            records.map(({ project }) => project),
            new Map(
              records.map(({ project, gallery }) => [
                project.slug,
                gallery ?? [],
              ]),
            ),
          ),
        };
      }),
    readFeatured: () =>
      sessions.withSnapshot(async (session) => {
        const queries = createQueries(session);
        const state = await queries.readPublishedState();

        if (state === null) return NEVER_PUBLISHED;

        const projects = await queries.readPublishedProjectsByIds(
          state.featuredProjectIds,
        );
        const projectsById = new Map(
          projects.map((record) => [record.projectId, record] as const),
        );
        const orderedRecords = state.featuredProjectIds.map((projectId) =>
          projectsById.get(projectId),
        );

        if (orderedRecords.some((project) => project === undefined)) {
          throw new PublishedSnapshotConsistencyError(
            "Published featured state references missing published Projects",
          );
        }
        const completeRecords = orderedRecords as [
          PublishedProjectRecord,
          PublishedProjectRecord,
          PublishedProjectRecord,
        ];
        const orderedProjects = completeRecords.map(({ project }) => project);

        return {
          status: "available",
          data: mapPublicFeaturedProjects(
            orderedProjects as [ProjectVersion, ProjectVersion, ProjectVersion],
            new Map(
              completeRecords.map(({ project, gallery }) => [
                project.slug,
                gallery ?? [],
              ]),
            ),
          ),
        };
      }),
    readBySlug: (slug) =>
      sessions.withSnapshot(async (session) => {
        const queries = createQueries(session);
        const state = await queries.readPublishedState();

        if (state === null) return NEVER_PUBLISHED;

        const slugRecord = await queries.readPublishedSlug(slug);

        if (slugRecord === null) return { status: "not-found" };
        if (slugRecord.kind === "redirect") {
          return { status: "redirect", slug: slugRecord.project.slug };
        }

        return {
          status: "available",
          data: mapPublicProjectDetail(
            slugRecord.project,
            slugRecord.gallery ?? [],
          ),
        };
      }),
  };
}

/** Creates the repository over an injected snapshot-consistent transaction. */
export function createDrizzlePublishedProjectReadRepository(
  sessions: SnapshotConsistentSessionBoundary<ProjectDatabaseTransaction>,
): PublishedProjectReadRepository {
  return createPublishedProjectReadRepository(
    sessions,
    createDrizzlePublishedProjectReadQueries,
  );
}
