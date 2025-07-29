import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:permissions');

export async function revokeRolePermission(
  db: Database,
  orgId: string,
  roleId: string,
  resourceId: string,
  action: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM role_permission 
       WHERE role_id = $(roleId) AND org_id = $(orgId) AND resource_id = $(resourceId) AND action = $(action)`,
      { roleId, orgId, resourceId, action }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to revoke role permission', { error, orgId, roleId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

export const revokeRolePermissionResolver = {
  Mutation: {
    revokeRolePermission: async (_: any, args: { orgId: string; roleId: string; resourceId: string; action: string }, context: { db: Database }) => {
      const result = await revokeRolePermission(context.db, args.orgId, args.roleId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};