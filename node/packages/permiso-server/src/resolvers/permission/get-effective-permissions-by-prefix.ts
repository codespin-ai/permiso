import type { Database } from '@codespin/permiso-db';
import { getEffectivePermissionsByPrefix } from '../../domain/permission/get-effective-permissions-by-prefix.js';

export const getEffectivePermissionsByPrefixResolver = {
  Query: {
    effectivePermissionsByPrefix: async (_: any, args: { orgId: string; userId: string; resourceIdPrefix: string; action?: string }, context: { db: Database }) => {
      const result = await getEffectivePermissionsByPrefix(context.db, args.orgId, args.userId, args.resourceIdPrefix, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};