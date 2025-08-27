import { revokeRolePermission } from "../../domain/permission/revoke-role-permission.js";
import { DataContext } from "../../domain/data-context.js";

export const revokeRolePermissionResolver = {
  Mutation: {
    revokeRolePermission: async (
      _: unknown,
      args: {
        orgId: string;
        roleId: string;
        resourceId: string;
        action: string;
      },
      context: DataContext,
    ) => {
      const result = await revokeRolePermission(
        context,
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
