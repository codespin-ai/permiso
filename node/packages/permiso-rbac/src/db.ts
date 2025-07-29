import pgPromise from 'pg-promise';
import { createLogger } from '@codespin/permiso-logger';

const logger = createLogger('permiso-rbac:db');

const pgp = pgPromise({
  error: (err, e) => {
    if (e.cn) {
      logger.error('Database connection error:', err);
    } else if (e.query) {
      logger.error('Query error:', err, { query: e.query });
    }
  }
});

export type Database = pgPromise.IDatabase<{}>;

let db: Database | null = null;

export function initializeDatabase(): Database {
  if (db) {
    return db;
  }

  const config = {
    host: process.env.PERMISO_DB_HOST || 'localhost',
    port: parseInt(process.env.PERMISO_DB_PORT || '5432'),
    database: process.env.PERMISO_DB_NAME || 'permiso',
    user: process.env.PERMISO_DB_USER || 'postgres',
    password: process.env.PERMISO_DB_PASSWORD || 'postgres',
    max: 30,
    idleTimeoutMillis: 30000,
  };

  logger.info('Initializing database connection', {
    host: config.host,
    port: config.port,
    database: config.database,
    user: config.user
  });

  db = pgp(config);
  return db;
}

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase() first.');
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await db.$pool.end();
    db = null;
    logger.info('Database connection closed');
  }
}