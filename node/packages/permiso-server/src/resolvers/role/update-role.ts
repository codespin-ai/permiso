import type { Database } from "@codespin/permiso-db";
import { updateRole } from "../../domain/role/update-role.js";
import { getRole } from "./get-role.js";

// Re-export domain function
export { updateRole };

export const updateRoleResolver = {
  Mutation: {
    updateRole: async (
      _: any,
      args: { orgId: string; roleId: string; input: any },
      context: { db: Database },
    ) => {
      const result = await updateRole(
        context.db,
        args.orgId,
        args.roleId,
        args.input,
      );
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const roleResult = await getRole(context.db, args.orgId, args.roleId);
      if (!roleResult.success) {
        throw roleResult.error;
      }
      return roleResult.data;
    },
  },
};
