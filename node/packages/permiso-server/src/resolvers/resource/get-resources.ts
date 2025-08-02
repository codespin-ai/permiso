import type { Database } from '@codespin/permiso-db';
import { getResources, getResourcesByIdPrefix } from '../../domain/resource/get-resources.js';

export const getResourcesResolver = {
  Query: {
    resources: async (_: any, args: { orgId: string; filter?: any; pagination?: any }, context: { db: Database }) => {
      let result;
      if (args.filter?.idPrefix) {
        result = await getResourcesByIdPrefix(context.db, args.orgId, args.filter.idPrefix);
      } else {
        result = await getResources(context.db, args.orgId, args.pagination);
      }
      
      if (!result.success) {
        throw result.error;
      }
      
      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination && !args.filter?.idPrefix) {
        const countResult = await getResources(context.db, args.orgId);
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
    }
  }
};