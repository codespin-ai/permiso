import type { Database } from "@codespin/permiso-db";
import { unassignUserRole } from "../../domain/user/unassign-user-role.js";
import { getUser } from "./get-user.js";

// Re-export domain function
export { unassignUserRole };

export const unassignUserRoleResolver = {
  Mutation: {
    unassignUserRole: async (
      _: any,
      args: { orgId: string; userId: string; roleId: string },
      context: { db: Database },
    ) => {
      const result = await unassignUserRole(
        context,
        args.orgId,
        args.userId,
        args.roleId,
      );
      if (!result.success) {
        throw result.error;
      }

      // Return the updated user
      const userResult = await getUser(context, args.orgId, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },
  },
};
