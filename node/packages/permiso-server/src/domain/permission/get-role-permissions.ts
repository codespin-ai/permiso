import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  RolePermissionWithOrgId,
  RolePermissionDbRow
} from '../../types.js';
import {
  mapRolePermissionFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:permissions');

export async function getRolePermissions(
  db: Database,
  orgId: string,
  roleId?: string,
  resourceId?: string,
  action?: string
): Promise<Result<RolePermissionWithOrgId[]>> {
  try {
    let query = `SELECT * FROM role_permission WHERE org_id = $(orgId)`;
    const params: Record<string, any> = { orgId };

    if (roleId) {
      query += ` AND role_id = $(roleId)`;
      params.roleId = roleId;
    }

    if (resourceId) {
      query += ` AND resource_id = $(resourceId)`;
      params.resourceId = resourceId;
    }

    if (action) {
      query += ` AND action = $(action)`;
      params.action = action;
    }

    query += ` ORDER BY created_at DESC`;

    const rows = await db.manyOrNone<RolePermissionDbRow>(query, params);
    return { success: true, data: rows.map(mapRolePermissionFromDb) };
  } catch (error) {
    logger.error('Failed to get role permissions', { error, orgId, roleId, resourceId, action });
    return { success: false, error: error as Error };
  }
}