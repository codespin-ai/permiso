import { getOrganizations } from "../../domain/organization/get-organizations.js";
import { DataContext } from "../../domain/data-context.js";

export const getOrganizationsResolver = {
  Query: {
    organizations: async (
      _: unknown,
      args: {
        filter?: { properties?: Array<{ name: string; value: unknown }> };
        pagination?: {
          limit?: number;
          offset?: number;
          sortDirection?: "ASC" | "DESC";
        };
      },
      context: DataContext,
    ) => {
      const result = await getOrganizations(
        context,
        args.filter,
        args.pagination,
      );
      if (!result.success) {
        throw result.error;
      }

      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination) {
        const countResult = await getOrganizations(context, args.filter);
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

    organizationsByIds: async (
      _: unknown,
      args: { ids: string[] },
      context: DataContext,
    ) => {
      const result = await getOrganizations(context, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
