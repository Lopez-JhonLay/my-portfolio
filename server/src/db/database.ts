import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";

import type { ProjectDatabase } from "./database-session.ts";
import * as projectSchema from "./schema/project-schema.ts";

export type DatabaseRuntime = {
  readonly database: ProjectDatabase;
  close(): Promise<void>;
};

/** Creates a lazy local PostgreSQL pool; no connection opens until first use. */
export function createDatabaseRuntime(
  connectionString: string,
): DatabaseRuntime {
  const pool = new Pool({
    application_name: "portfolio-cms-local-server",
    connectionString,
    connectionTimeoutMillis: 5_000,
    idleTimeoutMillis: 30_000,
    max: 5,
  });

  return {
    database: drizzle(pool, { schema: projectSchema }),
    close: () => pool.end(),
  };
}
