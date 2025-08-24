import { getRoles } from "../../domain/role/get-roles.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { getRoles };

export const getRolesResolver = {
  Query: {
    roles: async (
      _: any,
      args: { filter?: any; pagination?: any },
      context: DataContext,
    ) => {
      const result = await getRoles(context, args.filter, args.pagination);
      if (!result.success) {
        throw result.error;
      }

      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination) {
        const countResult = await getRoles(context, args.filter);
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

    rolesByIds: async (
      _: any,
      args: { ids: string[] },
      context: DataContext,
    ) => {
      const result = await getRoles(context, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
