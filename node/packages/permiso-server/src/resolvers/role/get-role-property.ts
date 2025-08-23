import { getRoleProperty } from "../../domain/role/get-role-property.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { getRoleProperty };

export const getRolePropertyResolver = {
  Query: {
    roleProperty: async (
      _: any,
      args: { orgId: string; roleId: string; propertyName: string },
      context: DataContext,
    ) => {
      const result = await getRoleProperty(
        context,
        args.orgId,
        args.roleId,
        args.propertyName,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
