import type { Database } from '@codespin/permiso-db';
import { grantRolePermission } from '../../domain/permission/grant-role-permission.js';

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