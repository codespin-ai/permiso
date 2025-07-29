import type { Database } from '@codespin/permiso-db';
import { getOrganizations } from '../../domain/organization/get-organizations.js';

export const getOrganizationsResolver = {
  Query: {
    organizations: async (_: any, args: { filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await getOrganizations(context.db, args.filter, args.pagination);
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

    organizationsByIds: async (_: any, args: { ids: string[] }, context: { db: Database }) => {
      const result = await getOrganizations(context.db, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};