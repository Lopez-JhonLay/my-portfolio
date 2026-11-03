import { asc, count, eq, sql } from "drizzle-orm";

import type {
  ProjectDatabaseTransaction,
  SnapshotConsistentSessionBoundary,
} from "../db/database-session.ts";
import { projectDrafts, projects } from "../db/schema/project-schema.ts";
import type { ProjectId, ProjectVersion } from "./project-contract.ts";

export type AdminProjectDraft = {
  readonly id: ProjectId;
  readonly lifecycle: "active" | "trashed";
  readonly publicationIntent: "include" | "exclude";
  readonly revision: bigint;
  readonly draft: ProjectVersion;
};

export type AdminProjectDraftReadRepository = {
  list(input: { readonly limit: number; readonly offset: number }): Promise<{
    readonly projects: readonly AdminProjectDraft[];
    readonly totalItems: number;
  }>;
  read(projectId: ProjectId): Promise<AdminProjectDraft | null>;
};

const selection = {
  id: projects.id,
  lifecycle: projects.lifecycle,
  publicationIntent: projects.publicationIntent,
  revision: projects.draftRevision,
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
};

type ProjectDraftRow = {
  readonly id: ProjectId;
  readonly lifecycle: "active" | "trashed";
  readonly publicationIntent: "include" | "exclude";
  readonly revision: bigint;
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
};

function mapProject(row: ProjectDraftRow): AdminProjectDraft {
  return {
    id: row.id,
    lifecycle: row.lifecycle,
    publicationIntent: row.publicationIntent,
    revision: row.revision,
    draft: {
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
    },
  };
}

function selectProject(session: ProjectDatabaseTransaction) {
  return session
    .select(selection)
    .from(projects)
    .innerJoin(projectDrafts, eq(projectDrafts.projectId, projects.id));
}

/** Reads protected draft state through one injected snapshot per operation. */
export function createDrizzleProjectDraftReadRepository(
  sessions: SnapshotConsistentSessionBoundary<ProjectDatabaseTransaction>,
): AdminProjectDraftReadRepository {
  return {
    list: ({ limit, offset }) =>
      sessions.withSnapshot(async (session) => {
        const rows = await selectProject(session)
          .orderBy(
            sql`CASE ${projectDrafts.category}
              WHEN 'Personal Project' THEN 1
              WHEN 'Work Project' THEN 2
              WHEN 'Capstone Project' THEN 3
            END`,
            asc(projectDrafts.groupOrder),
            asc(projectDrafts.name),
          )
          .limit(limit)
          .offset(offset);
        const totals = await session.select({ value: count() }).from(projects);

        return {
          projects: rows.map(mapProject),
          totalItems: totals[0]?.value ?? 0,
        };
      }),
    read: (projectId) =>
      sessions.withSnapshot(async (session) => {
        const rows = await selectProject(session)
          .where(eq(projects.id, projectId))
          .limit(1);
        return rows[0] === undefined ? null : mapProject(rows[0]);
      }),
  };
}
