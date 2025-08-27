import { deleteRole } from "../../domain/role/delete-role.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { deleteRole };

export const deleteRoleResolver = {
  Mutation: {
    deleteRole: async (
      _: unknown,
      args: { roleId: string; safetyKey?: string },
      context: DataContext & { safetyKey?: string },
    ) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error("Invalid safety key");
      }

      const result = await deleteRole(context, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
