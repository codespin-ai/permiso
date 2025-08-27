import {
  getResources,
  getResourcesByIdPrefix,
} from "../../domain/resource/get-resources.js";
import { DataContext } from "../../domain/data-context.js";

export const getResourcesResolver = {
  Query: {
    resources: async (
      _: unknown,
      args: {
        orgId: string;
        filter?: { idPrefix?: string };
        pagination?: {
          limit?: number;
          offset?: number;
          sortDirection?: "ASC" | "DESC";
        };
      },
      context: DataContext,
    ) => {
      let result;
      if (args.filter?.idPrefix) {
        result = await getResourcesByIdPrefix(context, args.filter.idPrefix);
      } else {
        result = await getResources(context, args.pagination);
      }

      if (!result.success) {
        throw result.error;
      }

      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination && !args.filter?.idPrefix) {
        const countResult = await getResources(context);
        if (countResult.success) {
          totalCount = countResult.data.length;
        }
      }

      const offset = args.pagination?.offset || 0;
      const hasNextPage =
        args.pagination?.limit !== undefined
          ? offset + args.pagination.limit < totalCount
          : false;
      const hasPreviousPage =
        args.pagination?.offset !== undefined
          ? args.pagination.offset > 0
          : false;

      return {
        nodes: result.data,
        totalCount,
        pageInfo: {
          hasNextPage,
          hasPreviousPage,
          startCursor: null,
          endCursor: null,
        },
      };
    },
  },
};
