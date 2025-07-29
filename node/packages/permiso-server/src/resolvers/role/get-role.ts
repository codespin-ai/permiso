import type { Database } from '@codespin/permiso-db';
import { getRole } from '../../domain/role/get-role.js';

// Re-export domain function
export { getRole };

export const getRoleResolver = {
  Query: {
    role: async (_: any, args: { orgId: string; roleId: string }, context: { db: Database }) => {
      const result = await getRole(context.db, args.orgId, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};