import { getRolePermissions } from "../../domain/permission/get-role-permissions.js";
import { DataContext } from "../../domain/data-context.js";

export const getRolePermissionsResolver = {
  Query: {
    rolePermissions: async (
      _: any,
      args: {
        orgId: string;
        roleId?: string;
        resourceId?: string;
        action?: string;
      },
      context: DataContext,
    ) => {
      const result = await getRolePermissions(
        context,
        args.orgId,
        args.roleId,
        args.resourceId,
        args.action,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
