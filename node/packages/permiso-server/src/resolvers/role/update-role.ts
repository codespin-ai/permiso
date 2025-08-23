import { updateRole } from "../../domain/role/update-role.js";
import { getRole } from "./get-role.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { updateRole };

export const updateRoleResolver = {
  Mutation: {
    updateRole: async (
      _: any,
      args: { orgId: string; roleId: string; input: any },
      context: DataContext,
    ) => {
      const result = await updateRole(
        context,
        args.orgId,
        args.roleId,
        args.input,
      );
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const roleResult = await getRole(context, args.orgId, args.roleId);
      if (!roleResult.success) {
        throw roleResult.error;
      }
      return roleResult.data;
    },
  },
};
