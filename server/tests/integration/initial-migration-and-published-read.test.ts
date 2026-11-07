import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createDrizzleSnapshotSessionBoundary } from "../../src/db/database-session.ts";
import {
  projectOperations,
  projects,
  publishedProjects,
  publishedSlugs,
  publishedState,
} from "../../src/db/schema/project-schema.ts";
import { createDrizzlePublishedProjectReadRepository } from "../../src/projects/published-project-repository.ts";
import { projectIdSchema } from "../../src/projects/project-contract.ts";
import {
  openPostgresqlTestHarness,
  type PostgresqlTestHarness,
} from "./postgresql-test-harness.ts";

const MIGRATION_URL = new URL(
  "../../drizzle/0000_initial-project-schema.sql",
  import.meta.url,
);
const PROJECT_IDS = {
  personalOne: projectIdSchema.parse("11111111-1111-4111-8111-111111111111"),
  personalTwo: projectIdSchema.parse("22222222-2222-4222-8222-222222222222"),
  workOne: projectIdSchema.parse("33333333-3333-4333-8333-333333333333"),
  capstoneOne: projectIdSchema.parse("44444444-4444-4444-8444-444444444444"),
  missing: projectIdSchema.parse("99999999-9999-4999-8999-999999999999"),
} as const;
const EXPECTED_TABLES = [
  "content_section_drafts",
  "draft_featured_state",
  "project_drafts",
  "project_operations",
  "projects",
  "published_content_sections",
  "published_projects",
  "published_slugs",
  "published_state",
] as const;
const EXPECTED_INDEXES = [
  "content_section_drafts_pkey",
  "draft_featured_state_pkey",
  "project_drafts_pkey",
  "project_operations_pkey",
  "projects_pkey",
  "published_content_sections_pkey",
  "published_projects_category_group_order_unique",
  "published_projects_pkey",
  "published_slugs_one_current_per_project",
  "published_slugs_pkey",
  "published_state_pkey",
] as const;

type CountRow = {
  count: number;
  type: string;
};

type NameRow = {
  name: string;
};

type SingletonRow = {
  revision: string;
  singletonId: number;
};

describe("current migrations and published Project reads on PostgreSQL", () => {
  let harness: PostgresqlTestHarness;

  beforeAll(async () => {
    harness = await openPostgresqlTestHarness({
      environment: process.env,
      migrationUrl: MIGRATION_URL,
    });
  });

  afterAll(async () => {
    if (harness !== undefined) {
      await harness.cleanup();
    }
  });

  it("applies the migration only inside the isolated schema", async () => {
    const tables = await harness.client.query<NameRow>(
      `SELECT table_name AS "name"
         FROM information_schema.tables
        WHERE table_schema = $1
        ORDER BY table_name`,
      [harness.schemaName],
    );
    const publicTables = await harness.client.query<NameRow>(
      `SELECT table_name AS "name"
         FROM information_schema.tables
        WHERE table_schema = 'public'
          AND table_name = ANY($1::text[])`,
      [[...EXPECTED_TABLES]],
    );
    const constraints = await harness.client.query<CountRow>(
      `SELECT CASE constraint_record.contype
                WHEN 'c' THEN 'CHECK'
                WHEN 'f' THEN 'FOREIGN KEY'
                WHEN 'p' THEN 'PRIMARY KEY'
                WHEN 'u' THEN 'UNIQUE'
              END AS "type",
              count(*)::integer AS "count"
         FROM pg_catalog.pg_constraint AS constraint_record
        WHERE constraint_record.connamespace = (
                SELECT namespace.oid
                  FROM pg_catalog.pg_namespace AS namespace
                 WHERE namespace.nspname = $1
              )
          AND constraint_record.contype IN ('c', 'f', 'p', 'u')
        GROUP BY constraint_record.contype
        ORDER BY "type"`,
      [harness.schemaName],
    );
    const indexes = await harness.client.query<NameRow>(
      `SELECT indexname AS "name"
         FROM pg_catalog.pg_indexes
        WHERE schemaname = $1
        ORDER BY indexname`,
      [harness.schemaName],
    );
    const singleton = await harness.client.query<SingletonRow>(
      `SELECT singleton_id AS "singletonId", revision::text AS "revision"
         FROM draft_featured_state`,
    );

    expect(tables.rows.map(({ name }) => name)).toEqual(EXPECTED_TABLES);
    expect(publicTables.rows).toEqual([]);
    expect(constraints.rows).toEqual([
      { count: 38, type: "CHECK" },
      { count: 11, type: "FOREIGN KEY" },
      { count: 9, type: "PRIMARY KEY" },
      { count: 1, type: "UNIQUE" },
    ]);
    expect(indexes.rows.map(({ name }) => name)).toEqual(EXPECTED_INDEXES);
    expect(singleton.rows).toEqual([{ revision: "1", singletonId: 1 }]);

    await expect(
      harness.client.query(
        `INSERT INTO projects (id, lifecycle, publication_intent, draft_revision)
         VALUES ($1, $2, $3, $4)`,
        [PROJECT_IDS.missing, "active", "include", 0],
      ),
    ).rejects.toMatchObject({ code: "23514" });
  });

  it("reads never-published state and real published rows through one Drizzle schema", async () => {
    const repository = createDrizzlePublishedProjectReadRepository(
      createDrizzleSnapshotSessionBoundary(harness.database),
    );

    await expect(repository.readGroups()).resolves.toEqual({
      status: "never-published",
    });

    await harness.database.insert(projects).values(
      Object.values(PROJECT_IDS)
        .filter((projectId) => projectId !== PROJECT_IDS.missing)
        .map((id) => ({
          id,
          lifecycle: "active" as const,
          publicationIntent: "include" as const,
        })),
    );
    await harness.database.insert(publishedProjects).values([
      {
        projectId: PROJECT_IDS.personalTwo,
        number: "File 02",
        name: "Personal Two",
        category: "Personal Project",
        description: "Second personal Project",
        tech: ["TypeScript"],
        groupOrder: 2,
      },
      {
        projectId: PROJECT_IDS.capstoneOne,
        number: "File 04",
        name: "Capstone One",
        category: "Capstone Project",
        description: "Capstone Project",
        tech: ["PostgreSQL"],
        groupOrder: 1,
      },
      {
        projectId: PROJECT_IDS.workOne,
        number: "File 03",
        name: "Work One",
        category: "Work Project",
        description: "Work Project",
        tech: ["Drizzle"],
        groupOrder: 1,
      },
      {
        projectId: PROJECT_IDS.personalOne,
        number: "File 01",
        name: "Personal One",
        category: "Personal Project",
        description: "First personal Project",
        role: "Developer",
        tech: ["TypeScript", "PostgreSQL"],
        repo: "https://example.com/personal-one",
        liveUrl: "https://example.com/personal-one/live",
        longDescriptionMarkdown: "## Published details",
        groupOrder: 1,
      },
    ]);
    await harness.database.insert(projectOperations).values({
      operationId: "publish-integration-fixture",
      kind: "publish",
      requestFingerprint: "integration-fixture-fingerprint",
      status: "succeeded",
      outcomeCode: "published",
      resultRevision: 1n,
      completedAt: new Date("2026-10-31T00:00:00.000Z"),
    });
    await harness.database.insert(publishedSlugs).values([
      {
        slug: "personal-one",
        projectId: PROJECT_IDS.personalOne,
        kind: "current",
      },
      {
        slug: "personal-one-old",
        projectId: PROJECT_IDS.personalOne,
        kind: "redirect",
      },
      {
        slug: "personal-two",
        projectId: PROJECT_IDS.personalTwo,
        kind: "current",
      },
      {
        slug: "work-one",
        projectId: PROJECT_IDS.workOne,
        kind: "current",
      },
      {
        slug: "capstone-one",
        projectId: PROJECT_IDS.capstoneOne,
        kind: "current",
      },
    ]);
    await harness.database.insert(publishedState).values({
      singletonId: 1,
      snapshotRevision: 1n,
      operationId: "publish-integration-fixture",
      slot1ProjectId: PROJECT_IDS.capstoneOne,
      slot2ProjectId: PROJECT_IDS.personalTwo,
      slot3ProjectId: PROJECT_IDS.workOne,
      publishedAt: new Date("2026-10-31T00:00:00.000Z"),
    });

    const groups = await repository.readGroups();
    const featured = await repository.readFeatured();
    const detail = await repository.readBySlug("personal-one");

    expect(groups).toMatchObject({
      status: "available",
      data: [
        {
          category: "Personal Project",
          projects: [{ slug: "personal-one" }, { slug: "personal-two" }],
        },
        { category: "Work Project", projects: [{ slug: "work-one" }] },
        {
          category: "Capstone Project",
          projects: [{ slug: "capstone-one" }],
        },
      ],
    });
    expect(featured).toMatchObject({
      status: "available",
      data: {
        projects: [
          { slug: "capstone-one" },
          { slug: "personal-two" },
          { slug: "work-one" },
        ],
      },
    });
    expect(detail).toEqual({
      status: "available",
      data: {
        number: "File 01",
        name: "Personal One",
        category: "Personal Project",
        description: "First personal Project",
        role: "Developer",
        tech: ["TypeScript", "PostgreSQL"],
        repo: "https://example.com/personal-one",
        liveUrl: "https://example.com/personal-one/live",
        slug: "personal-one",
        longDescriptionMarkdown: "## Published details",
      },
    });
    expect(JSON.stringify({ featured, groups })).not.toMatch(
      /groupOrder|longDescriptionMarkdown|projectId|draftRevision|publicationIntent/,
    );
    await expect(repository.readBySlug("personal-one-old")).resolves.toEqual({
      status: "redirect",
      slug: "personal-one",
    });
    await expect(repository.readBySlug("missing-project")).resolves.toEqual({
      status: "not-found",
    });

    await expect(
      harness.client.query(
        `INSERT INTO published_slugs (slug, project_id, kind)
         VALUES ($1, $2, $3)`,
        ["missing-project", PROJECT_IDS.missing, "current"],
      ),
    ).rejects.toMatchObject({ code: "23503" });
    await expect(
      harness.client.query(
        `INSERT INTO published_slugs (slug, project_id, kind)
         VALUES ($1, $2, $3)`,
        ["personal-one-again", PROJECT_IDS.personalOne, "current"],
      ),
    ).rejects.toMatchObject({ code: "23505" });
  });
});
