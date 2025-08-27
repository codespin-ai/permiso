import { unassignUserRole } from "../../domain/user/unassign-user-role.js";
import { getUser } from "./get-user.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { unassignUserRole };

export const unassignUserRoleResolver = {
  Mutation: {
    unassignUserRole: async (
      _: unknown,
      args: { userId: string; roleId: string },
      context: DataContext,
    ) => {
      const result = await unassignUserRole(context, args.userId, args.roleId);
      if (!result.success) {
        throw result.error;
      }

      // Return the updated user
      const userResult = await getUser(context, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },
  },
};
