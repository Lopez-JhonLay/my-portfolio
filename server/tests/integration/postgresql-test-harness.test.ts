import { readFile } from "node:fs/promises";

import { describe, expect, it } from "vitest";

import {
  assertTemporarySchemaName,
  createTemporarySchemaName,
  rebaseMigrationSql,
  validatePostgresqlTestTarget,
} from "./postgresql-test-harness.ts";

const TEST_CONNECTION_STRING =
  "postgresql://portfolio_test_user:test-password@127.0.0.1:5432/portfolio_cms_test";
const MIGRATION_URL = new URL(
  "../../drizzle/0000_initial-project-schema.sql",
  import.meta.url,
);

describe("PostgreSQL test-target guard", () => {
  it("accepts only the explicit local test target", () => {
    expect(
      validatePostgresqlTestTarget({
        NODE_ENV: "test",
        POSTGRES_TEST_URL: TEST_CONNECTION_STRING,
      }),
    ).toEqual({
      connectionString: TEST_CONNECTION_STRING,
      databaseName: "portfolio_cms_test",
    });
  });

  it.each([
    {
      name: "a missing test environment marker",
      environment: { POSTGRES_TEST_URL: TEST_CONNECTION_STRING },
    },
    {
      name: "a missing connection string",
      environment: { NODE_ENV: "test" },
    },
    {
      name: "an external host",
      environment: {
        NODE_ENV: "test",
        POSTGRES_TEST_URL:
          "postgresql://portfolio_test_user:test-password@example.com:5432/portfolio_cms_test",
      },
    },
    {
      name: "a database outside the allowlist",
      environment: {
        NODE_ENV: "test",
        POSTGRES_TEST_URL:
          "postgresql://portfolio_test_user:test-password@127.0.0.1:5432/postgres",
      },
    },
    {
      name: "default PostgreSQL credentials",
      environment: {
        NODE_ENV: "test",
        POSTGRES_TEST_URL:
          "postgresql://postgres:postgres@127.0.0.1:5432/portfolio_cms_test",
      },
    },
    {
      name: "connection-string options",
      environment: {
        NODE_ENV: "test",
        POSTGRES_TEST_URL: `${TEST_CONNECTION_STRING}?options=-csearch_path%3Dpublic`,
      },
    },
  ])("rejects $name", ({ environment }) => {
    expect(() => validatePostgresqlTestTarget(environment)).toThrow(
      /PostgreSQL integration test target refused/,
    );
  });
});

describe("temporary PostgreSQL schema guard", () => {
  it("creates a unique allowlisted schema name", () => {
    const first = createTemporarySchemaName(
      () => "123e4567-e89b-12d3-a456-426614174000",
    );
    const second = createTemporarySchemaName(
      () => "123e4567-e89b-12d3-a456-426614174001",
    );

    expect(first).toBe("portfolio_cms_test_123e4567e89b12d3a456426614174000");
    expect(second).not.toBe(first);
    expect(() => assertTemporarySchemaName(first)).not.toThrow();
  });

  it.each([
    "public",
    "portfolio_cms_test",
    "portfolio_cms_test_",
    "portfolio_cms_test_not-a-uuid",
    "other_test_123e4567e89b12d3a456426614174000",
  ])("rejects ambiguous cleanup target %s", (schemaName) => {
    expect(() => assertTemporarySchemaName(schemaName)).toThrow(
      /PostgreSQL temporary schema refused/,
    );
  });
});

describe("test-only migration rebasing", () => {
  it("rebases every known qualifier into the validated temporary schema", async () => {
    const migrationSql = await readFile(MIGRATION_URL, "utf8");
    const schemaName = createTemporarySchemaName(
      () => "123e4567-e89b-12d3-a456-426614174000",
    );

    const rebasedSql = rebaseMigrationSql(migrationSql, schemaName);

    expect(rebasedSql).not.toContain('"public".');
    expect(
      rebasedSql.match(new RegExp(`"${schemaName}"\\.`, "g")),
    ).toHaveLength(17);
    expect(migrationSql).toContain('"public"."projects"');
  });

  it("rejects missing, added, or unknown public qualifiers", async () => {
    const migrationSql = await readFile(MIGRATION_URL, "utf8");
    const schemaName = createTemporarySchemaName(
      () => "123e4567-e89b-12d3-a456-426614174000",
    );

    expect(() =>
      rebaseMigrationSql(
        migrationSql.replace('"public"."projects"', '"projects"'),
        schemaName,
      ),
    ).toThrow(/known schema qualifiers/);
    expect(() =>
      rebaseMigrationSql(
        `${migrationSql}\nSELECT * FROM "public"."unexpected";`,
        schemaName,
      ),
    ).toThrow(/known schema qualifiers/);
  });

  it("rejects SQL outside the reviewed migration statement forms", async () => {
    const migrationSql = await readFile(MIGRATION_URL, "utf8");
    const schemaName = createTemporarySchemaName(
      () => "123e4567-e89b-12d3-a456-426614174000",
    );

    expect(() =>
      rebaseMigrationSql(
        `${migrationSql}\n--> statement-breakpoint\nDROP TABLE "projects";`,
        schemaName,
      ),
    ).toThrow(/reviewed statement forms/);
  });
});
