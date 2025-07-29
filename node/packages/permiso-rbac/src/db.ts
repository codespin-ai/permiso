import { getDb, type Database } from '@codespin/permiso-db';
import { createLogger } from '@codespin/permiso-logger';

const logger = createLogger('permiso-rbac:db');

export type { Database };

export function initializeDatabase(): Database {
  const db = getDb();
  logger.info('Database connection initialized');
  return db;
}

export function getDatabase(): Database {
  return getDb();
}

export async function closeDatabase(): Promise<void> {
  const db = getDb();
  await db.$pool.end();
  logger.info('Database connection closed');
}