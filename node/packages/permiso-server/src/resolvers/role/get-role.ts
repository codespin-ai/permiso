import { getRole } from "../../domain/role/get-role.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { getRole };

export const getRoleResolver = {
  Query: {
    role: async (_: any, args: { roleId: string }, context: DataContext) => {
      const result = await getRole(context, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
