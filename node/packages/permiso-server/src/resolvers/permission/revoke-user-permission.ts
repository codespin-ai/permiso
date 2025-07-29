import type { Database } from '@codespin/permiso-db';
import { revokeUserPermission } from '../../domain/permission/revoke-user-permission.js';

export const revokeUserPermissionResolver = {
  Mutation: {
    revokeUserPermission: async (_: any, args: { orgId: string; userId: string; resourceId: string; action: string }, context: { db: Database }) => {
      const result = await revokeUserPermission(context.db, args.orgId, args.userId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};