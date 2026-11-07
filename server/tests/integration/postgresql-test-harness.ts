import { randomUUID } from "node:crypto";
import { readFile } from "node:fs/promises";

import { drizzle } from "drizzle-orm/node-postgres";
import { Client } from "pg";

import type { ProjectDatabase } from "../../src/db/database-session.ts";
import * as projectSchema from "../../src/db/schema/project-schema.ts";

const ALLOWED_DATABASE_NAME = "portfolio_cms_test";
const ALLOWED_HOSTS = new Set(["127.0.0.1", "localhost", "[::1]"]);
const TEMPORARY_SCHEMA_PATTERN = /^portfolio_cms_test_[0-9a-f]{32}$/;
const STATEMENT_BREAKPOINT = "--> statement-breakpoint";
const REVIEWED_STATEMENT_PREFIXES = [
  "CREATE TYPE ",
  "CREATE TABLE ",
  'INSERT INTO "draft_featured_state" ',
  'INSERT INTO "content_section_drafts" ',
  "ALTER TYPE ",
  "ALTER TABLE ",
  "CREATE UNIQUE INDEX ",
] as const;
const EXPECTED_PUBLIC_QUALIFIERS = new Map([
  ["project_category", 1],
  ["project_lifecycle", 1],
  ["project_operation_kind", 1],
  ["project_operation_status", 1],
  ["project_publication_intent", 1],
  ["published_slug_kind", 1],
  ["projects", 7],
  ["project_operations", 1],
  ["published_projects", 3],
]);
const EXPECTED_CONTENT_MIGRATION_PUBLIC_QUALIFIERS = new Map([
  ["content_section_key", 1],
  ["project_operation_kind", 1],
]);
const CURRENT_ADDITIONAL_MIGRATION_URLS = [
  new URL("../../drizzle/0001_sturdy_nick_fury.sql", import.meta.url),
] as const;

export type PostgresqlTestTarget = {
  readonly connectionString: string;
  readonly databaseName: typeof ALLOWED_DATABASE_NAME;
};

export type PostgresqlTestHarness = {
  readonly client: Client;
  readonly database: ProjectDatabase;
  readonly schemaName: string;
  withAdditionalDatabase<Result>(
    use: (database: ProjectDatabase) => Promise<Result>,
  ): Promise<Result>;
  cleanup(): Promise<void>;
};

function refuseTarget(reason: string): never {
  throw new Error(`PostgreSQL integration test target refused: ${reason}`);
}

/** Validates the explicit, local-only PostgreSQL integration-test boundary. */
export function validatePostgresqlTestTarget(
  environment: Readonly<NodeJS.ProcessEnv>,
): PostgresqlTestTarget {
  if (environment.NODE_ENV !== "test") {
    refuseTarget("NODE_ENV must equal test");
  }

  const connectionString = environment.POSTGRES_TEST_URL;

  if (connectionString === undefined || connectionString.length === 0) {
    refuseTarget("POSTGRES_TEST_URL is required");
  }

  let target: URL;

  try {
    target = new URL(connectionString);
  } catch {
    refuseTarget("POSTGRES_TEST_URL must be a valid URL");
  }

  if (target.protocol !== "postgres:" && target.protocol !== "postgresql:") {
    refuseTarget("only PostgreSQL URLs are accepted");
  }
  if (!ALLOWED_HOSTS.has(target.hostname)) {
    refuseTarget("host is not loopback");
  }
  if (target.pathname !== `/${ALLOWED_DATABASE_NAME}`) {
    refuseTarget("database name is not allowlisted");
  }
  if (target.username.length === 0 || target.password.length === 0) {
    refuseTarget("explicit non-default credentials are required");
  }
  if (target.username === "postgres" || target.password === "postgres") {
    refuseTarget("default PostgreSQL credentials are prohibited");
  }
  if (target.search.length > 0 || target.hash.length > 0) {
    refuseTarget("connection-string options are prohibited");
  }

  return {
    connectionString,
    databaseName: ALLOWED_DATABASE_NAME,
  };
}

/** Refuses schema names that cannot identify exactly one owned test schema. */
export function assertTemporarySchemaName(schemaName: string): void {
  if (!TEMPORARY_SCHEMA_PATTERN.test(schemaName)) {
    throw new Error(
      "PostgreSQL temporary schema refused: name is not an exact generated test schema",
    );
  }
}

export function createTemporarySchemaName(
  createUuid: () => string = randomUUID,
): string {
  const schemaName = `portfolio_cms_test_${createUuid().replaceAll("-", "")}`;
  assertTemporarySchemaName(schemaName);
  return schemaName;
}

function assertReviewedStatements(migrationSql: string): void {
  const statements = migrationSql
    .split(STATEMENT_BREAKPOINT)
    .map((statement) => statement.trim())
    .filter((statement) => statement.length > 0);

  if (
    statements.length === 0 ||
    statements.some(
      (statement) =>
        !REVIEWED_STATEMENT_PREFIXES.some((prefix) =>
          statement.startsWith(prefix),
        ) || (statement.match(/;/g)?.length ?? 0) !== 1,
    )
  ) {
    throw new Error(
      "PostgreSQL migration refused: SQL is outside the reviewed statement forms",
    );
  }
}

function assertKnownPublicQualifiers(
  migrationSql: string,
  expectedQualifiers = EXPECTED_PUBLIC_QUALIFIERS,
): void {
  const actualCounts = new Map<string, number>();
  const qualifierPattern = /"public"\."([a-z_]+)"/g;

  for (const match of migrationSql.matchAll(qualifierPattern)) {
    const qualifiedName = match[1];

    if (qualifiedName === undefined) {
      throw new Error(
        "PostgreSQL migration refused: unable to inspect schema qualifiers",
      );
    }

    actualCounts.set(qualifiedName, (actualCounts.get(qualifiedName) ?? 0) + 1);
  }

  const exactMatch =
    actualCounts.size === expectedQualifiers.size &&
    [...expectedQualifiers].every(
      ([qualifiedName, count]) => actualCounts.get(qualifiedName) === count,
    );

  if (
    !exactMatch ||
    migrationSql.includes("public.") ||
    /\bpublic\b/.test(migrationSql.replaceAll(/"public"\."[a-z_]+"/g, ""))
  ) {
    throw new Error(
      "PostgreSQL migration refused: SQL does not contain only the known schema qualifiers",
    );
  }
}

/** Rewrites only the reviewed migration's exact public-schema qualifiers. */
export function rebaseMigrationSql(
  migrationSql: string,
  schemaName: string,
): string {
  assertTemporarySchemaName(schemaName);
  assertKnownPublicQualifiers(migrationSql);
  assertReviewedStatements(migrationSql);

  const rebasedSql = migrationSql.replaceAll('"public".', `"${schemaName}".`);

  if (rebasedSql.includes('"public".')) {
    throw new Error(
      "PostgreSQL migration refused: public-schema qualifier survived rebasing",
    );
  }

  return rebasedSql;
}

/** Rewrites only the reviewed full-content migration qualifiers. */
export function rebaseContentMigrationSql(
  migrationSql: string,
  schemaName: string,
): string {
  assertTemporarySchemaName(schemaName);
  assertKnownPublicQualifiers(
    migrationSql,
    EXPECTED_CONTENT_MIGRATION_PUBLIC_QUALIFIERS,
  );
  assertReviewedStatements(migrationSql);
  return migrationSql.replaceAll('"public".', `"${schemaName}".`);
}

function quoteValidatedSchemaName(schemaName: string): string {
  assertTemporarySchemaName(schemaName);
  return `"${schemaName}"`;
}

type DatabaseIdentityRow = {
  databaseName: string;
  ownerName: string;
  schemaName: string | null;
};

type SchemaOwnershipRow = {
  ownerName: string;
  schemaName: string;
};

async function readDatabaseIdentity(
  client: Client,
): Promise<DatabaseIdentityRow> {
  const result = await client.query<DatabaseIdentityRow>(
    'SELECT current_database() AS "databaseName", current_user AS "ownerName", current_schema() AS "schemaName"',
  );
  const identity = result.rows[0];

  if (identity === undefined) {
    throw new Error(
      "PostgreSQL test harness refused an unreadable target identity",
    );
  }

  return identity;
}

async function readSchemaOwnership(
  client: Client,
  schemaName: string,
): Promise<SchemaOwnershipRow | null> {
  const result = await client.query<SchemaOwnershipRow>(
    `SELECT namespace.nspname AS "schemaName", owner.rolname AS "ownerName"
       FROM pg_catalog.pg_namespace AS namespace
       INNER JOIN pg_catalog.pg_roles AS owner ON owner.oid = namespace.nspowner
      WHERE namespace.nspname = $1`,
    [schemaName],
  );

  return result.rows[0] ?? null;
}

export async function openPostgresqlTestHarness(options: {
  readonly environment: Readonly<NodeJS.ProcessEnv>;
  readonly migrationUrl: URL;
  readonly additionalMigrationUrls?: readonly URL[];
}): Promise<PostgresqlTestHarness> {
  const target = validatePostgresqlTestTarget(options.environment);
  const schemaName = createTemporarySchemaName();
  const quotedSchemaName = quoteValidatedSchemaName(schemaName);
  const migrationSql = await readFile(options.migrationUrl, "utf8");
  const rebasedMigrationSql = rebaseMigrationSql(migrationSql, schemaName);
  const additionalMigrations = await Promise.all(
    (options.additionalMigrationUrls ?? CURRENT_ADDITIONAL_MIGRATION_URLS).map(
      async (migrationUrl) =>
        rebaseContentMigrationSql(
          await readFile(migrationUrl, "utf8"),
          schemaName,
        ),
    ),
  );
  const client = new Client({
    application_name: "portfolio-cms-integration-test",
    connectionString: target.connectionString,
  });

  await client.connect();

  let ownerName: string;

  try {
    await client.query("BEGIN");
    await client.query(
      `CREATE SCHEMA ${quotedSchemaName} AUTHORIZATION CURRENT_USER`,
    );
    await client.query(`SET search_path TO ${quotedSchemaName}`);

    const identity = await readDatabaseIdentity(client);
    const ownership = await readSchemaOwnership(client, schemaName);

    if (
      identity.databaseName !== target.databaseName ||
      identity.schemaName !== schemaName ||
      ownership?.schemaName !== schemaName ||
      ownership.ownerName !== identity.ownerName
    ) {
      throw new Error(
        "PostgreSQL test harness refused an unexpected schema identity or owner",
      );
    }

    ownerName = identity.ownerName;
    await client.query(rebasedMigrationSql);
    await client.query("COMMIT");
    for (const additionalMigration of additionalMigrations) {
      await client.query("BEGIN");
      await client.query(`SET search_path TO ${quotedSchemaName}`);
      await client.query(additionalMigration);
      await client.query("COMMIT");
    }
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    await client.end().catch(() => undefined);
    throw error;
  }

  const database = drizzle(client, { schema: projectSchema });

  return {
    client,
    database,
    schemaName,
    withAdditionalDatabase: async (use) => {
      assertTemporarySchemaName(schemaName);
      const additionalClient = new Client({
        application_name: "portfolio-cms-integration-test-additional-session",
        connectionString: target.connectionString,
      });
      await additionalClient.connect();

      try {
        await additionalClient.query(`SET search_path TO ${quotedSchemaName}`);
        const identity = await readDatabaseIdentity(additionalClient);
        const ownership = await readSchemaOwnership(
          additionalClient,
          schemaName,
        );

        if (
          identity.databaseName !== target.databaseName ||
          identity.schemaName !== schemaName ||
          identity.ownerName !== ownerName ||
          ownership?.schemaName !== schemaName ||
          ownership.ownerName !== ownerName
        ) {
          throw new Error(
            "PostgreSQL additional test session refused an unexpected database, schema, or owner",
          );
        }

        return await use(drizzle(additionalClient, { schema: projectSchema }));
      } finally {
        await additionalClient.end();
      }
    },
    cleanup: async () => {
      assertTemporarySchemaName(schemaName);

      try {
        const identity = await readDatabaseIdentity(client);
        const ownership = await readSchemaOwnership(client, schemaName);

        if (
          identity.databaseName !== target.databaseName ||
          identity.schemaName !== schemaName ||
          identity.ownerName !== ownerName ||
          ownership?.schemaName !== schemaName ||
          ownership.ownerName !== ownerName
        ) {
          throw new Error(
            "PostgreSQL test cleanup refused an unexpected database, schema, or owner",
          );
        }

        await client.query(`DROP SCHEMA ${quotedSchemaName} CASCADE`);

        if ((await readSchemaOwnership(client, schemaName)) !== null) {
          throw new Error(
            "PostgreSQL test cleanup could not verify schema removal",
          );
        }
      } finally {
        await client.end();
      }
    },
  };
}
