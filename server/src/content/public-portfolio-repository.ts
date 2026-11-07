import { asc } from "drizzle-orm";

import type {
  ProjectDatabaseTransaction,
  SnapshotConsistentSessionBoundary,
} from "../db/database-session.ts";
import { publishedContentSections } from "../db/schema/project-schema.ts";
import {
  mapPublicFeaturedProjects,
  mapPublicProjectGroups,
} from "../projects/public-project-mapper.ts";
import type {
  PublicFeaturedProjectsDto,
  PublicProjectGroupsDto,
} from "../projects/public-project-contract.ts";
import {
  createDrizzlePublishedProjectReadQueries,
  PublishedSnapshotConsistencyError,
} from "../projects/published-project-repository.ts";
import type { ProjectVersion } from "../projects/project-contract.ts";
import {
  parseContentDocument,
  type ContentDocument,
  type ContentSectionKey,
} from "./content-contract.ts";

export type PublicContentSectionDto = {
  readonly sectionKey: ContentSectionKey;
  readonly document: ContentDocument;
};

export type PublicPortfolioSnapshotDto =
  | {
      readonly status: "never-published";
      readonly sections: readonly [];
    }
  | {
      readonly status: "published";
      readonly snapshotRevision: string;
      readonly sections: readonly PublicContentSectionDto[];
      readonly featuredProjects: PublicFeaturedProjectsDto;
      readonly projectGroups: PublicProjectGroupsDto;
    };

export type PublicPortfolioRepository = {
  read(): Promise<PublicPortfolioSnapshotDto>;
};

export function createDrizzlePublicPortfolioRepository(
  sessions: SnapshotConsistentSessionBoundary<ProjectDatabaseTransaction>,
): PublicPortfolioRepository {
  return {
    read: () =>
      sessions.withSnapshot(async (session) => {
        const projectQueries =
          createDrizzlePublishedProjectReadQueries(session);
        const state = await projectQueries.readPublishedState();
        if (state === null) {
          return { status: "never-published", sections: [] } as const;
        }

        const projects = await projectQueries.readPublishedProjects();
        const featured = await projectQueries.readPublishedProjectsByIds(
          state.featuredProjectIds,
        );
        const projectsById = new Map(
          featured.map(
            ({ projectId, project }) => [projectId, project] as const,
          ),
        );
        const orderedFeatured = state.featuredProjectIds.map((projectId) =>
          projectsById.get(projectId),
        );
        if (orderedFeatured.some((project) => project === undefined)) {
          throw new PublishedSnapshotConsistencyError(
            "Published portfolio references missing featured Projects",
          );
        }
        const contentRows = await session
          .select()
          .from(publishedContentSections)
          .orderBy(asc(publishedContentSections.sectionKey));

        return {
          status: "published",
          snapshotRevision: state.snapshotRevision.toString(),
          sections: contentRows.map((row) => ({
            sectionKey: row.sectionKey,
            document: parseContentDocument(row.sectionKey, row.document),
          })),
          featuredProjects: mapPublicFeaturedProjects(
            orderedFeatured as [ProjectVersion, ProjectVersion, ProjectVersion],
          ),
          projectGroups: mapPublicProjectGroups(
            projects.map(({ project }) => project),
          ),
        } as const;
      }),
  };
}
