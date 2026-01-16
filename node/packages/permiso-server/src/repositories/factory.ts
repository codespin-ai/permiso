/**
 * Repository Factory
 *
 * Creates appropriate repository implementations based on database configuration.
 * Supports both PostgreSQL (with RLS) and SQLite (with app-level tenant filtering).
 */

import type { Database } from "@codespin/permiso-db";
import type { Repositories } from "./interfaces/index.js";
import type { SQLiteDb } from "./sqlite/index.js";

// Database configuration
export type DatabaseConfig =
  | { type: "postgres"; db: Database; orgId: string }
  | { type: "sqlite"; db: SQLiteDb; orgId: string };

/**
 * Create repositories for PostgreSQL
 * Uses RLS for tenant isolation (org_id is set via SET LOCAL)
 */
async function createPostgresRepositories(
  db: Database,
  orgId: string,
): Promise<Repositories> {
  // Dynamic import to avoid loading postgres code when using sqlite
  const { createPostgresRepositories: create } = await import(
    "./postgres/index.js"
  );
  return create(db, orgId);
}

/**
 * Create repositories for SQLite
 * Uses explicit org_id filtering in all queries (no RLS)
 */
async function createSqliteRepositoriesFromDb(
  db: SQLiteDb,
  orgId: string,
): Promise<Repositories> {
  // Dynamic import to avoid loading sqlite code when using postgres
  const { createSqliteRepositories: create } = await import(
    "./sqlite/index.js"
  );
  return create(db, orgId);
}

/**
 * Initialize repositories with the given database configuration
 */
export async function createRepositories(
  config: DatabaseConfig,
): Promise<Repositories> {
  if (config.type === "sqlite") {
    return createSqliteRepositoriesFromDb(config.db, config.orgId);
  }
  return createPostgresRepositories(config.db, config.orgId);
}

// Re-export types
export type { Repositories };
