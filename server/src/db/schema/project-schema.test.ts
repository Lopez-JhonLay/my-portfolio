import { readFile } from "node:fs/promises";

import { getTableName } from "drizzle-orm";
import { getTableConfig } from "drizzle-orm/pg-core";
import { describe, expect, it } from "vitest";

import { publishedState } from "./project-schema.ts";

const MIGRATION_URL = new URL(
  "../../../drizzle/0000_initial-project-schema.sql",
  import.meta.url,
);
const SNAPSHOT_URL = new URL(
  "../../../drizzle/meta/0000_snapshot.json",
  import.meta.url,
);
const FEATURED_FOREIGN_KEYS = [
  {
    column: "slot_1_project_id",
    name: "published_state_featured_slot_1_project_fk",
  },
  {
    column: "slot_2_project_id",
    name: "published_state_featured_slot_2_project_fk",
  },
  {
    column: "slot_3_project_id",
    name: "published_state_featured_slot_3_project_fk",
  },
] as const;

function requiredCapture(
  value: string | undefined,
  description: string,
): string {
  if (value === undefined) throw new Error(`Missing ${description}`);
  return value;
}

describe("initial Project schema migration", () => {
  it("keeps featured foreign-key names PostgreSQL-safe and aligned", async () => {
    const migration = await readFile(MIGRATION_URL, "utf8");
    const snapshot = await readFile(SNAPSHOT_URL, "utf8");
    const schemaForeignKeys = getTableConfig(publishedState)
      .foreignKeys.filter((foreignKey) =>
        foreignKey.getName().startsWith("published_state_featured_slot_"),
      )
      .map((foreignKey) => {
        const reference = foreignKey.reference();
        const column = reference.columns.at(0);
        const foreignColumn = reference.foreignColumns.at(0);

        if (column === undefined || foreignColumn === undefined) {
          throw new Error("Expected one-column featured Project foreign key");
        }

        return {
          column: column.name,
          foreignColumn: foreignColumn.name,
          foreignTable: getTableName(reference.foreignTable),
          name: foreignKey.getName(),
          onDelete: foreignKey.onDelete,
          onUpdate: foreignKey.onUpdate,
        };
      });

    expect(schemaForeignKeys).toEqual(
      FEATURED_FOREIGN_KEYS.map(({ column, name }) => ({
        column,
        foreignColumn: "project_id",
        foreignTable: "published_projects",
        name,
        onDelete: "restrict",
        onUpdate: "restrict",
      })),
    );

    for (const { column, name } of FEATURED_FOREIGN_KEYS) {
      expect(Buffer.byteLength(name, "utf8")).toBeLessThanOrEqual(63);
      expect(migration).toContain(
        `CONSTRAINT "${name}" FOREIGN KEY ("${column}") REFERENCES "public"."published_projects"("project_id") ON DELETE restrict ON UPDATE restrict`,
      );
      expect(snapshot).toContain(`"name": "${name}"`);
    }

    expect(migration).not.toContain(
      "published_state_slot_1_project_id_published_projects_project_id_fk",
    );
    expect(snapshot).not.toContain(
      "published_state_slot_1_project_id_published_projects_project_id_fk",
    );
  });

  it("keeps every quoted migration identifier within PostgreSQL's limit", async () => {
    const migration = await readFile(MIGRATION_URL, "utf8");
    const identifiers = [...migration.matchAll(/"([^"]+)"/g)].map(
      ([, identifier]) => requiredCapture(identifier, "quoted identifier"),
    );

    expect(identifiers.length).toBeGreaterThan(0);
    expect(
      identifiers.filter(
        (identifier) => Buffer.byteLength(identifier, "utf8") > 63,
      ),
    ).toEqual([]);
  });

  it("retains the verifier's exact migration anchors", async () => {
    const migration = await readFile(MIGRATION_URL, "utf8");
    const enums = [
      ...migration.matchAll(
        /CREATE TYPE "public"\."([^"]+)" AS ENUM\(([^;]+)\);/g,
      ),
    ].map(([, name, labels]) => {
      const capturedLabels = requiredCapture(labels, "enum labels");

      return {
        labels: [...capturedLabels.matchAll(/'([^']+)'/g)].map(([, label]) =>
          requiredCapture(label, "enum label"),
        ),
        name: requiredCapture(name, "enum name"),
      };
    });
    const tables = [...migration.matchAll(/CREATE TABLE "([^"]+)"/g)].map(
      ([, name]) => requiredCapture(name, "table name"),
    );

    expect(enums).toEqual([
      {
        labels: ["Personal Project", "Work Project", "Capstone Project"],
        name: "project_category",
      },
      { labels: ["active", "trashed"], name: "project_lifecycle" },
      {
        labels: ["save_project_draft", "save_featured_draft", "publish"],
        name: "project_operation_kind",
      },
      {
        labels: ["pending", "succeeded", "failed"],
        name: "project_operation_status",
      },
      {
        labels: ["include", "exclude"],
        name: "project_publication_intent",
      },
      { labels: ["current", "redirect"], name: "published_slug_kind" },
    ]);
    expect(tables).toEqual([
      "draft_featured_state",
      "project_drafts",
      "project_operations",
      "projects",
      "published_projects",
      "published_slugs",
      "published_state",
    ]);
    expect(migration).toContain(
      'CREATE UNIQUE INDEX "published_slugs_one_current_per_project"',
    );
    expect(migration).toContain(
      'INSERT INTO "draft_featured_state" ("singleton_id", "revision") VALUES (1, 1);',
    );
  });
});
