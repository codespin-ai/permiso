import type { Database } from "@codespin/permiso-db";
import { assignUserRole } from "../../domain/user/assign-user-role.js";
import { getUser } from "./get-user.js";

// Re-export domain function
export { assignUserRole };

export const assignUserRoleResolver = {
  Mutation: {
    assignUserRole: async (
      _: any,
      args: { orgId: string; userId: string; roleId: string },
      context: { db: Database },
    ) => {
      const result = await assignUserRole(
        context.db,
        args.orgId,
        args.userId,
        args.roleId,
      );
      if (!result.success) {
        throw result.error;
      }

      // Return the updated user
      const userResult = await getUser(context.db, args.orgId, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },
  },
};
