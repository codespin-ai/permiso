import type { Database } from '@codespin/permiso-db';
import { deleteRoleProperty } from '../../domain/role/delete-role-property.js';

// Re-export domain function
export { deleteRoleProperty };

export const deleteRolePropertyResolver = {
  Mutation: {
    deleteRoleProperty: async (_: any, args: { orgId: string; roleId: string; name: string }, context: { db: Database }) => {
      const result = await deleteRoleProperty(context.db, args.orgId, args.roleId, args.name);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};