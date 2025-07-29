import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  UserPermissionWithOrgId,
  UserPermissionDbRow
} from '../../types.js';
import {
  mapUserPermissionFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:permissions');

export async function grantUserPermission(
  db: Database,
  orgId: string,
  userId: string,
  resourceId: string,
  action: string
): Promise<Result<UserPermissionWithOrgId>> {
  try {
    const row = await db.one<UserPermissionDbRow>(
      `INSERT INTO user_permission (user_id, org_id, resource_id, action) 
       VALUES ($(userId), $(orgId), $(resourceId), $(action)) 
       ON CONFLICT (user_id, org_id, resource_id, action) DO UPDATE SET created_at = NOW()
       RETURNING *`,
      { userId, orgId, resourceId, action }
    );

    return { success: true, data: mapUserPermissionFromDb(row) };
  } catch (error) {
    logger.error('Failed to grant user permission', { error, orgId, userId, resourceId, action });
    return { success: false, error: error as Error };
  }
}