import { deleteRoleProperty } from "../../domain/role/delete-role-property.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { deleteRoleProperty };

export const deleteRolePropertyResolver = {
  Mutation: {
    deleteRoleProperty: async (
      _: any,
      args: { roleId: string; name: string },
      context: DataContext,
    ) => {
      const result = await deleteRoleProperty(
        context,
        args.roleId,
        args.name,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
