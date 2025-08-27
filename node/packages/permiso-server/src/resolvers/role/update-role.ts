import { updateRole } from "../../domain/role/update-role.js";
import { getRole } from "./get-role.js";
import { DataContext } from "../../domain/data-context.js";
import type { UpdateRoleInput } from "../../generated/graphql.js";

// Re-export domain function
export { updateRole };

export const updateRoleResolver = {
  Mutation: {
    updateRole: async (
      _: unknown,
      args: { roleId: string; input: UpdateRoleInput },
      context: DataContext,
    ) => {
      const result = await updateRole(context, args.roleId, args.input);
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const roleResult = await getRole(context, args.roleId);
      if (!roleResult.success) {
        throw roleResult.error;
      }
      return roleResult.data;
    },
  },
};
