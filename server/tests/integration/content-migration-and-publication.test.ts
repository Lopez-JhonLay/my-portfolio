import { count, eq } from "drizzle-orm";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  CONTENT_SECTION_KEYS,
  parseContentDocument,
} from "../../src/content/content-contract.ts";
import { createDrizzleContentMutationService } from "../../src/content/content-repository.ts";
import { createDrizzlePublicPortfolioRepository } from "../../src/content/public-portfolio-repository.ts";
import {
  createDrizzleSnapshotSessionBoundary,
  createDrizzleTransactionSessionBoundary,
} from "../../src/db/database-session.ts";
import {
  contentSectionDrafts,
  draftFeaturedState,
  projectDrafts,
  projects,
  publishedContentSections,
} from "../../src/db/schema/project-schema.ts";
import { projectIdSchema } from "../../src/projects/project-contract.ts";
import { createDrizzleProjectPublicationService } from "../../src/projects/project-publication-repository.ts";
import {
  openPostgresqlTestHarness,
  type PostgresqlTestHarness,
} from "./postgresql-test-harness.ts";

const INITIAL_MIGRATION_URL = new URL(
  "../../drizzle/0000_initial-project-schema.sql",
  import.meta.url,
);
const PROJECT_IDS = [
  projectIdSchema.parse("11111111-1111-4111-8111-111111111111"),
  projectIdSchema.parse("22222222-2222-4222-8222-222222222222"),
  projectIdSchema.parse("33333333-3333-4333-8333-333333333333"),
] as const;

describe("full-content migration and publication on PostgreSQL", () => {
  let harness: PostgresqlTestHarness;

  beforeAll(async () => {
    harness = await openPostgresqlTestHarness({
      environment: process.env,
      migrationUrl: INITIAL_MIGRATION_URL,
    });
  });

  afterAll(async () => {
    if (harness !== undefined) await harness.cleanup();
  });

  it("seeds every audited draft with valid content", async () => {
    const rows = await harness.database.select().from(contentSectionDrafts);

    expect(rows).toHaveLength(CONTENT_SECTION_KEYS.length);
    expect(new Set(rows.map(({ sectionKey }) => sectionKey))).toEqual(
      new Set(CONTENT_SECTION_KEYS),
    );
    for (const row of rows) {
      expect(parseContentDocument(row.sectionKey, row.document)).toEqual(
        row.document,
      );
      expect(row.revision).toBe(1n);
    }
  });

  it("saves content and publishes it atomically with Projects", async () => {
    const sessions = createDrizzleTransactionSessionBoundary(harness.database);
    const contentService = createDrizzleContentMutationService(sessions);
    const [hero] = await harness.database
      .select()
      .from(contentSectionDrafts)
      .where(eq(contentSectionDrafts.sectionKey, "hero"));
    if (hero === undefined) throw new Error("Missing seeded Hero content");
    const heroDocument = parseContentDocument("hero", hero.document);
    if (!("title" in heroDocument)) throw new Error("Invalid Hero content");

    await expect(
      contentService.saveDraft({
        operationId: "44444444-4444-4444-8444-444444444444",
        sectionKey: "hero",
        expectedRevision: 1n,
        document: { ...heroDocument, title: "Published CMS Hero" },
      }),
    ).resolves.toMatchObject({
      status: "succeeded",
      resultRevision: 2n,
    });

    await harness.database.insert(projects).values(
      PROJECT_IDS.map((id) => ({
        id,
        lifecycle: "active" as const,
        publicationIntent: "include" as const,
      })),
    );
    await harness.database.insert(projectDrafts).values(
      PROJECT_IDS.map((projectId, index) => ({
        projectId,
        number: `File 0${index + 1}`,
        name: `Project ${index + 1}`,
        category: "Personal Project" as const,
        description: `Description ${index + 1}`,
        tech: ["TypeScript"],
        repo: `https://example.com/project-${index + 1}`,
        slug: `project-${index + 1}`,
        groupOrder: index + 1,
      })),
    );
    await harness.database
      .update(draftFeaturedState)
      .set({
        slot1ProjectId: PROJECT_IDS[0],
        slot2ProjectId: PROJECT_IDS[1],
        slot3ProjectId: PROJECT_IDS[2],
      })
      .where(eq(draftFeaturedState.singletonId, 1));

    const publicationService = createDrizzleProjectPublicationService(sessions);
    await expect(
      publicationService.publishUpdates({
        operationId: "55555555-5555-4555-8555-555555555555",
      }),
    ).resolves.toMatchObject({
      status: "succeeded",
      snapshotRevision: 1n,
    });

    const [publishedCount] = await harness.database
      .select({ value: count() })
      .from(publishedContentSections);
    expect(publishedCount?.value).toBe(CONTENT_SECTION_KEYS.length);

    const publicSnapshot = await createDrizzlePublicPortfolioRepository(
      createDrizzleSnapshotSessionBoundary(harness.database),
    ).read();
    expect(publicSnapshot).toMatchObject({
      status: "published",
      snapshotRevision: "1",
    });
    if (publicSnapshot.status !== "published") {
      throw new Error("Expected a published portfolio snapshot");
    }
    expect(publicSnapshot.sections).toHaveLength(CONTENT_SECTION_KEYS.length);
    expect(
      publicSnapshot.sections.find(({ sectionKey }) => sectionKey === "hero"),
    ).toMatchObject({ document: { title: "Published CMS Hero" } });
  });
});
