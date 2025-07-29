import type { Database } from '@codespin/permiso-db';
import { getRoles } from '../../domain/role/get-roles.js';

// Re-export domain function
export { getRoles };

export const getRolesResolver = {
  Query: {
    roles: async (_: any, args: { orgId: string; filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await getRoles(context.db, args.orgId, args.filter, args.pagination);
      if (!result.success) {
        throw result.error;
      }
      return {
        nodes: result.data,
        totalCount: result.data.length,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null
        }
      };
    },

    rolesByIds: async (_: any, args: { orgId: string; ids: string[] }, context: { db: Database }) => {
      const result = await getRoles(context.db, args.orgId, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};