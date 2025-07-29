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
    }
  }
};