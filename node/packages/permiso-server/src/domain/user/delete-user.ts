import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:users');

export async function deleteUser(
  db: Database,
  orgId: string,
  userId: string
): Promise<Result<boolean>> {
  try {
    await db.none(`DELETE FROM "user" WHERE id = $(userId) AND org_id = $(orgId)`, { userId, orgId });
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete user', { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}