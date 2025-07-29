import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:users');

export async function deleteUserProperty(
  db: Database,
  orgId: string,
  userId: string,
  name: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM user_property WHERE user_id = $(userId) AND org_id = $(orgId) AND name = $(name)`,
      { userId, orgId, name }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete user property', { error, orgId, userId, name });
    return { success: false, error: error as Error };
  }
}