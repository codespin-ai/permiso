import pgPromise from "pg-promise";

const pgp = pgPromise({});

const db = pgp({
  host: process.env.PERMISO_DB_HOST || 'localhost',
  port: process.env.PERMISO_DB_PORT
    ? parseInt(process.env.PERMISO_DB_PORT, 10)
    : 5432,
  database: process.env.PERMISO_DB_NAME || 'permiso',
  user: process.env.PERMISO_DB_USER || 'postgres',
  password: process.env.PERMISO_DB_PASSWORD || 'postgres',
});

export function getDb() {
  return db;
}

export type Database = pgPromise.IDatabase<unknown>;