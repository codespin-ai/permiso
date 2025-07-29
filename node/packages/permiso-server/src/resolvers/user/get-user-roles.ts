import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:users');

export async function getUserRoles(
  db: Database,
  orgId: string,
  userId: string
): Promise<Result<string[]>> {
  try {
    const rows = await db.manyOrNone<{ role_id: string }>(
      `SELECT role_id FROM user_role WHERE user_id = $(userId) AND org_id = $(orgId)`,
      { userId, orgId }
    );

    return { success: true, data: rows.map(r => r.role_id) };
  } catch (error) {
    logger.error('Failed to get user roles', { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}