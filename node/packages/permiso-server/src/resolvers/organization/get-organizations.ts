import type { Database } from '@codespin/permiso-db';
import { getOrganizations } from '../../domain/organization/get-organizations.js';

export const getOrganizationsResolver = {
  Query: {
    organizations: async (_: any, args: { filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await getOrganizations(context.db, args.filter, args.pagination);
      if (!result.success) {
        throw result.error;
      }
      
      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination) {
        const countResult = await getOrganizations(context.db, args.filter);
        if (countResult.success) {
          totalCount = countResult.data.length;
        }
      }
      
      const offset = args.pagination?.offset || 0;
      const hasNextPage = args.pagination?.limit !== undefined
        ? (offset + args.pagination.limit) < totalCount
        : false;
      const hasPreviousPage = args.pagination?.offset !== undefined 
        ? args.pagination.offset > 0
        : false;
      
      return {
        nodes: result.data,
        totalCount,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
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