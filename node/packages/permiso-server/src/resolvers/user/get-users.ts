import type { Database } from "@codespin/permiso-db";
import { getUsers } from "../../domain/user/get-users.js";

// Re-export domain function
export { getUsers };

export const getUsersResolver = {
  Query: {
    users: async (
      _: any,
      args: { orgId: string; filter?: any; pagination?: any },
      context: { db: Database },
    ) => {
      const result = await getUsers(
        context,
        args.orgId,
        args.filter,
        args.pagination,
      );
      if (!result.success) {
        throw result.error;
      }

      // Get total count without pagination
      let totalCount = result.data.length;
      if (args.pagination) {
        const countResult = await getUsers(context, args.orgId, args.filter);
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

    usersByIds: async (
      _: any,
      args: { orgId: string; ids: string[] },
      context: { db: Database },
    ) => {
      const result = await getUsers(context, args.orgId, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
