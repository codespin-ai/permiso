/**
 * Database Configuration
 *
 * Reads PERMISO_DB_TYPE and creates appropriate database connections.
 * All required environment variables must be set - no defaults.
 */

import { createLogger } from "@codespin/permiso-logger";
import {
  createLazyDb,
  type Database as PgDatabase,
} from "@codespin/permiso-db";
import { type Repositories } from "../repositories/interfaces/index.js";
import { createRepositories } from "../repositories/factory.js";
import type { SQLiteDb } from "../repositories/sqlite/index.js";

const logger = createLogger("permiso-server:config:database");

export type DatabaseType = "postgres" | "sqlite";

export type DatabaseConfig = {
  type: DatabaseType;
};

/**
 * Validate that all required environment variables are set.
 * Throws an error if any required variable is missing.
 */
function validateEnv(): DatabaseType {
  const dbType = process.env.PERMISO_DB_TYPE;

  if (!dbType) {
    throw new Error(
      "PERMISO_DB_TYPE environment variable is required (sqlite or postgres)",
    );
  }

  if (dbType !== "sqlite" && dbType !== "postgres") {
    throw new Error(
      `PERMISO_DB_TYPE must be 'sqlite' or 'postgres', got: ${dbType}`,
    );
  }

  if (dbType === "sqlite") {
    if (!process.env.PERMISO_SQLITE_PATH) {
      throw new Error(
        "PERMISO_SQLITE_PATH environment variable is required for sqlite",
      );
    }
  } else {
    // PostgreSQL requires these variables
    const required = ["PERMISO_DB_HOST", "PERMISO_DB_PORT", "PERMISO_DB_NAME"];

    const missing = required.filter((key) => !process.env[key]);
    if (missing.length > 0) {
      throw new Error(
        `Missing required PostgreSQL environment variables: ${missing.join(", ")}`,
      );
    }
  }

  // Server config
  if (!process.env.PERMISO_SERVER_HOST) {
    throw new Error("PERMISO_SERVER_HOST environment variable is required");
  }
  if (!process.env.PERMISO_SERVER_PORT) {
    throw new Error("PERMISO_SERVER_PORT environment variable is required");
  }

  return dbType;
}

let _dbType: DatabaseType | null = null;
let _sqliteDb: SQLiteDb | null = null;

/**
 * Initialize database configuration.
 * Must be called at startup before any database operations.
 */
export async function initializeDatabaseConfig(): Promise<DatabaseConfig> {
  _dbType = validateEnv();

  logger.info(`Database type: ${_dbType}`);

  if (_dbType === "sqlite") {
    // Dynamic import to avoid loading sqlite3 when using postgres
    const Database = (await import("better-sqlite3")).default;
    const path = process.env.PERMISO_SQLITE_PATH!;
    _sqliteDb = new Database(path);
    logger.info(`SQLite database: ${path}`);
  }

  return { type: _dbType };
}

/**
 * Get the configured database type.
 * Throws if initializeDatabaseConfig hasn't been called.
 */
export function getDatabaseType(): DatabaseType {
  if (!_dbType) {
    throw new Error(
      "Database not initialized. Call initializeDatabaseConfig() first.",
    );
  }
  return _dbType;
}

/**
 * Create repositories for the current request.
 *
 * For PostgreSQL: Creates a lazy RLS-enabled connection per org
 * For SQLite: Uses shared connection with app-level filtering
 */
export async function createRequestRepositories(
  orgId?: string,
): Promise<Repositories> {
  const dbType = getDatabaseType();

  if (dbType === "postgres") {
    // PostgreSQL: Create lazy RLS connection
    const db: PgDatabase = createLazyDb(orgId);
    return createRepositories({
      type: "postgres",
      db,
      orgId: orgId ?? "",
    });
  } else {
    // SQLite: Use shared connection
    if (!_sqliteDb) {
      throw new Error("SQLite database not initialized");
    }
    return createRepositories({
      type: "sqlite",
      db: _sqliteDb,
      orgId: orgId ?? "",
    });
  }
}

/**
 * Get the raw PostgreSQL database for health checks.
 * Only works when using PostgreSQL.
 */
export function getPostgresHealthCheckDb(): PgDatabase | null {
  if (_dbType === "postgres") {
    return createLazyDb();
  }
  return null;
}

/**
 * Get the raw SQLite database for health checks.
 * Only works when using SQLite.
 */
export function getSqliteHealthCheckDb(): SQLiteDb | null {
  return _sqliteDb;
}

/**
 * Close database connections on shutdown.
 */
export function closeDatabaseConnections(): void {
  if (_sqliteDb) {
    _sqliteDb.close();
    _sqliteDb = null;
  }
}
