import { setRoleProperty } from "../../domain/role/set-role-property.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { setRoleProperty };

export const setRolePropertyResolver = {
  Mutation: {
    setRoleProperty: async (
      _: any,
      args: {
        orgId: string;
        roleId: string;
        name: string;
        value: unknown;
        hidden?: boolean;
      },
      context: DataContext,
    ) => {
      const result = await setRoleProperty(
        context,
        args.orgId,
        args.roleId,
        args.name,
        args.value,
        args.hidden ?? false,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
