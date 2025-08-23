/* eslint-disable @typescript-eslint/no-explicit-any */
import pgPromise from "pg-promise";
import { RlsDatabaseWrapper } from "./rls-wrapper.js";
export * as sql from "./sql.js";

const pgp = pgPromise();

// Export the Database interface - this is what all consumers use
export interface Database {
  query: <T = any>(query: string, values?: any) => Promise<T[]>;
  one: <T = any>(query: string, values?: any) => Promise<T>;
  oneOrNone: <T = any>(query: string, values?: any) => Promise<T | null>;
  none: (query: string, values?: any) => Promise<null>;
  many: <T = any>(query: string, values?: any) => Promise<T[]>;
  manyOrNone: <T = any>(query: string, values?: any) => Promise<T[]>;
  any: <T = any>(query: string, values?: any) => Promise<T[]>;
  result: (query: string, values?: any) => Promise<pgPromise.IResultExt>;
  tx: <T>(callback: (t: Database) => Promise<T>) => Promise<T>;
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

// Single shared connection pool for all database connections
// This prevents connection pool exhaustion by ensuring only one pool exists
const connectionPools = new Map<string, pgPromise.IDatabase<any>>();

function getConnectionKey(user: string): string {
  const host = process.env.PERMISO_DB_HOST || "localhost";
  const port = process.env.PERMISO_DB_PORT || "5432";
  const database = process.env.PERMISO_DB_NAME || "permiso";
  return `${host}:${port}:${database}:${user}`;
}

function getOrCreateConnection(
  user: string,
  password: string,
): pgPromise.IDatabase<any> {
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
  }

  return connectionPools.get(key)!;
}

// Create RLS-enabled database connection
export function createRlsDb(orgId: string): Database {
  if (!orgId) {
    throw new Error("Organization ID is required for RLS database");
  }

  // Special case: "ROOT" organization bypasses RLS
  if (orgId === "ROOT") {
    return createUnrestrictedDb();
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

// Legacy functions for backwards compatibility
export function getDb(): Database {
  // DEPRECATED: getDb() uses legacy connection. Use createRlsDb() or createUnrestrictedDb() instead.
  const user = process.env.PERMISO_DB_USER || "postgres";
  const password = process.env.PERMISO_DB_PASSWORD || "postgres";
  return getOrCreateConnection(user, password) as Database;
}

export function createDatabaseConnection(config: DatabaseConfig): Database {
  // Use the shared connection pool to prevent exhaustion
  const key = `${config.host}:${config.port}:${config.database}:${config.user}`;

  if (!connectionPools.has(key)) {
    connectionPools.set(
      key,
      pgp({
        ...config,
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      }),
    );
  }

  return connectionPools.get(key)! as Database;
}
