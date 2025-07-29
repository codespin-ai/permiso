import type { Database } from '@codespin/permiso-db';
import { getUsers } from '../../domain/user/get-users.js';

// Re-export domain function
export { getUsers };

export const getUsersResolver = {
  Query: {
    users: async (_: any, args: { orgId: string; filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await getUsers(context.db, args.orgId, args.filter, args.pagination);
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

    usersByIds: async (_: any, args: { orgId: string; ids: string[] }, context: { db: Database }) => {
      const result = await getUsers(context.db, args.orgId, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};