import pgPromise from "pg-promise";
import { RlsDatabaseWrapper } from "./rls-wrapper.js";
export * as sql from "./sql.js";
export { createLazyDb } from "./lazy-db.js";

const pgp = pgPromise();

// Export the Database interface - this is what all consumers use
export interface Database {
  query: <T = unknown>(query: string, values?: unknown) => Promise<T[]>;
  one: <T = unknown>(query: string, values?: unknown) => Promise<T>;
  oneOrNone: <T = unknown>(
    query: string,
    values?: unknown,
  ) => Promise<T | null>;
  none: (query: string, values?: unknown) => Promise<null>;
  many: <T = unknown>(query: string, values?: unknown) => Promise<T[]>;
  manyOrNone: <T = unknown>(query: string, values?: unknown) => Promise<T[]>;
  any: <T = unknown>(query: string, values?: unknown) => Promise<T[]>;
  result: (query: string, values?: unknown) => Promise<pgPromise.IResultExt>;
  tx: <T>(callback: (t: Database) => Promise<T>) => Promise<T>;

  // Optional method for upgrading to ROOT access
  // Only available on RLS databases, not on already-unrestricted databases
  upgradeToRoot?: (reason?: string) => Database;
}

// Single shared connection pool for all database connections
// This prevents connection pool exhaustion by ensuring only one pool exists
const connectionPools = new Map<string, pgPromise.IDatabase<unknown>>();

function getConnectionKey(user: string): string {
  const host = process.env.PERMISO_DB_HOST || "localhost";
  const port = process.env.PERMISO_DB_PORT || "5432";
  const database = process.env.PERMISO_DB_NAME || "permiso";
  return `${host}:${port}:${database}:${user}`;
}

function getOrCreateConnection(
  user: string,
  password: string,
): pgPromise.IDatabase<unknown> {
  const key = getConnectionKey(user);

  if (!connectionPools.has(key)) {
    const config = {
      host: process.env.PERMISO_DB_HOST || "localhost",
      port: process.env.PERMISO_DB_PORT
        ? parseInt(process.env.PERMISO_DB_PORT, 10)
        : 5432,
      database: process.env.PERMISO_DB_NAME || "permiso",
      user,
      password,
      // Optimize pool settings to prevent exhaustion
      max: 20, // Maximum pool size
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };

    connectionPools.set(key, pgp(config));
  } else {
    // Connection pool already exists, will be reused
  }

  return connectionPools.get(key)!;
}

// Create RLS-enabled database connection
export function createRlsDb(orgId: string): Database {
  if (!orgId) {
    throw new Error("Organization ID is required for RLS database");
  }

  const user = process.env.RLS_DB_USER || "rls_db_user";
  const password = process.env.RLS_DB_USER_PASSWORD || "";

  if (!password) {
    throw new Error("RLS_DB_USER_PASSWORD environment variable is required");
  }

  const connection = getOrCreateConnection(user, password);
  return new RlsDatabaseWrapper(connection, orgId);
}

// Create unrestricted database connection (for migrations, admin tasks, ROOT org)
export function createUnrestrictedDb(): Database {
  const user = process.env.UNRESTRICTED_DB_USER || "unrestricted_db_user";
  const password = process.env.UNRESTRICTED_DB_USER_PASSWORD || "";

  if (!password) {
    throw new Error(
      "UNRESTRICTED_DB_USER_PASSWORD environment variable is required",
    );
  }

  return getOrCreateConnection(user, password) as Database;
}

// Legacy functions removed - use createRlsDb() or createUnrestrictedDb() instead
