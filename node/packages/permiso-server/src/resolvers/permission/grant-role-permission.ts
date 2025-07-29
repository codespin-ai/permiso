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

export async function grantRolePermission(
  db: Database,
  orgId: string,
  roleId: string,
  resourceId: string,
  action: string
): Promise<Result<RolePermissionWithOrgId>> {
  try {
    const row = await db.one<RolePermissionDbRow>(
      `INSERT INTO role_permission (role_id, org_id, resource_id, action) 
       VALUES ($(roleId), $(orgId), $(resourceId), $(action)) 
       ON CONFLICT (role_id, org_id, resource_id, action) DO UPDATE SET created_at = NOW()
       RETURNING *`,
      { roleId, orgId, resourceId, action }
    );

    return { success: true, data: mapRolePermissionFromDb(row) };
  } catch (error) {
    logger.error('Failed to grant role permission', { error, orgId, roleId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

export const grantRolePermissionResolver = {
  Mutation: {
    grantRolePermission: async (_: any, args: { input: { orgId: string; roleId: string; resourceId: string; action: string } }, context: { db: Database }) => {
      const result = await grantRolePermission(context.db, args.input.orgId, args.input.roleId, args.input.resourceId, args.input.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};