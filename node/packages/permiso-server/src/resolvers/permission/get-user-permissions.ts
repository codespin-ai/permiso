import type { Database } from '@codespin/permiso-db';
import { getUserPermissions } from '../../domain/permission/get-user-permissions.js';

export const getUserPermissionsResolver = {
  Query: {
    userPermissions: async (_: any, args: { orgId: string; userId?: string; resourceId?: string; action?: string }, context: { db: Database }) => {
      const result = await getUserPermissions(context.db, args.orgId, args.userId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};