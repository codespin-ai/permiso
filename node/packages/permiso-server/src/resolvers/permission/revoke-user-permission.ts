import { revokeUserPermission } from "../../domain/permission/revoke-user-permission.js";
import { DataContext } from "../../domain/data-context.js";

export const revokeUserPermissionResolver = {
  Mutation: {
    revokeUserPermission: async (
      _: any,
      args: {
        orgId: string;
        userId: string;
        resourceId: string;
        action: string;
      },
      context: DataContext,
    ) => {
      const result = await revokeUserPermission(
        context,
        args.userId,
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
