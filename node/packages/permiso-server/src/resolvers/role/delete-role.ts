import type { Database } from "@codespin/permiso-db";
import { deleteRole } from "../../domain/role/delete-role.js";

// Re-export domain function
export { deleteRole };

export const deleteRoleResolver = {
  Mutation: {
    deleteRole: async (
      _: any,
      args: { orgId: string; roleId: string; safetyKey?: string },
      context: { db: Database; safetyKey?: string },
    ) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error("Invalid safety key");
      }

      const result = await deleteRole(context.db, args.orgId, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
