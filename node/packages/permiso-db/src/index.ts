import pgPromise from "pg-promise";

const pgp = pgPromise({});

// Default database connection
const defaultDb = pgp({
  host: process.env.PERMISO_DB_HOST || 'localhost',
  port: process.env.PERMISO_DB_PORT
    ? parseInt(process.env.PERMISO_DB_PORT, 10)
    : 5432,
  database: process.env.PERMISO_DB_NAME || 'permiso',
  user: process.env.PERMISO_DB_USER || 'postgres',
  password: process.env.PERMISO_DB_PASSWORD || 'postgres',
});

export function getDb() {
  return defaultDb;
}

export type Database = pgPromise.IDatabase<unknown>;

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
}

export function createDatabaseConnection(config: DatabaseConfig): Database {
  return pgp(config);
}