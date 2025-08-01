import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:users');

export async function unassignUserRole(
  db: Database,
  orgId: string,
  userId: string,
  roleId: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM user_role WHERE user_id = $(userId) AND role_id = $(roleId) AND org_id = $(orgId)`,
      { userId, roleId, orgId }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to unassign user role', { error, orgId, userId, roleId });
    return { success: false, error: error as Error };
  }
}