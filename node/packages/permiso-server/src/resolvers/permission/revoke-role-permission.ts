import type { Database } from '@codespin/permiso-db';
import { revokeRolePermission } from '../../domain/permission/revoke-role-permission.js';

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