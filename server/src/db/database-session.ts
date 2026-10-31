import type { ExtractTablesWithRelations } from "drizzle-orm";
import type {
  NodePgDatabase,
  NodePgTransaction,
} from "drizzle-orm/node-postgres";

import * as projectSchema from "./schema/project-schema.ts";

export type ProjectDatabase = NodePgDatabase<typeof projectSchema>;
export type ProjectDatabaseTransaction = NodePgTransaction<
  typeof projectSchema,
  ExtractTablesWithRelations<typeof projectSchema>
>;

/** Runs every callback inside one snapshot-consistent database session. */
export type SnapshotConsistentSessionBoundary<Session> = {
  withSnapshot<Result>(
    read: (session: Session) => Promise<Result>,
  ): Promise<Result>;
};

/**
 * Adapts an injected Drizzle database without creating a pool or connection.
 * Each read callback receives one read-only repeatable-read transaction.
 */
export function createDrizzleSnapshotSessionBoundary(
  database: ProjectDatabase,
): SnapshotConsistentSessionBoundary<ProjectDatabaseTransaction> {
  return {
    withSnapshot: (read) =>
      database.transaction(read, {
        accessMode: "read only",
        isolationLevel: "repeatable read",
      }),
  };
}
