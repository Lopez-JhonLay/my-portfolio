import { and, eq, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

import type {
  ProjectDatabaseTransaction,
  SnapshotConsistentSessionBoundary,
} from "../db/database-session.ts";
import {
  publishedProjects,
  publishedSlugs,
  publishedState,
} from "../db/schema/project-schema.ts";
import type { ProjectId, ProjectVersion } from "./project-contract.ts";
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
};

export type PublishedProjectRecord = {
  projectId: ProjectId;
  project: ProjectVersion;
};

export type PublishedSlugRecord = {
  kind: "current" | "redirect";
  project: ProjectVersion;
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
  | { readonly status: "unavailable" };

export type PublishedSlugReadResult =
  | PublishedReadResult<PublicProjectDetailDto>
  | { readonly status: "not-found" }
  | { readonly status: "redirect"; readonly slug: string };

export type PublishedProjectReadRepository = {
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

const UNAVAILABLE = { status: "unavailable" } as const;
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
  };
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
          };
    },
    readPublishedProjects: async () =>
      (await publishedProjectJoin(session)).map(toPublishedProjectRecord),
    readPublishedProjectsByIds: async (projectIds) =>
      (
        await publishedProjectJoin(session).where(
          inArray(publishedProjects.projectId, [...projectIds]),
        )
      ).map(toPublishedProjectRecord),
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

      return row === undefined
        ? null
        : {
            kind: row.kind,
            project: toPublishedProjectRecord(row).project,
          };
    },
  };
}

export function createPublishedProjectReadRepository<Session>(
  sessions: SnapshotConsistentSessionBoundary<Session>,
  createQueries: (session: Session) => PublishedProjectReadQueries,
): PublishedProjectReadRepository {
  return {
    readGroups: () =>
      sessions.withSnapshot(async (session) => {
        const queries = createQueries(session);
        const state = await queries.readPublishedState();

        if (state === null) return UNAVAILABLE;

        return {
          status: "available",
          data: mapPublicProjectGroups(
            (await queries.readPublishedProjects()).map(
              ({ project }) => project,
            ),
          ),
        };
      }),
    readFeatured: () =>
      sessions.withSnapshot(async (session) => {
        const queries = createQueries(session);
        const state = await queries.readPublishedState();

        if (state === null) return UNAVAILABLE;

        const projects = await queries.readPublishedProjectsByIds(
          state.featuredProjectIds,
        );
        const projectsById = new Map(
          projects.map(
            ({ projectId, project }) => [projectId, project] as const,
          ),
        );
        const orderedProjects = state.featuredProjectIds.map((projectId) =>
          projectsById.get(projectId),
        );

        if (orderedProjects.some((project) => project === undefined)) {
          throw new PublishedSnapshotConsistencyError(
            "Published featured state references missing published Projects",
          );
        }

        return {
          status: "available",
          data: mapPublicFeaturedProjects(
            orderedProjects as [ProjectVersion, ProjectVersion, ProjectVersion],
          ),
        };
      }),
    readBySlug: (slug) =>
      sessions.withSnapshot(async (session) => {
        const queries = createQueries(session);
        const state = await queries.readPublishedState();

        if (state === null) return UNAVAILABLE;

        const slugRecord = await queries.readPublishedSlug(slug);

        if (slugRecord === null) return { status: "not-found" };
        if (slugRecord.kind === "redirect") {
          return { status: "redirect", slug: slugRecord.project.slug };
        }

        return {
          status: "available",
          data: mapPublicProjectDetail(slugRecord.project),
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
