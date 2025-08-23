import { getUserPermissions } from "../../domain/permission/get-user-permissions.js";
import { DataContext } from "../../domain/data-context.js";

export const getUserPermissionsResolver = {
  Query: {
    userPermissions: async (
      _: any,
      args: {
        orgId: string;
        userId?: string;
        resourceId?: string;
        action?: string;
      },
      context: DataContext,
    ) => {
      const result = await getUserPermissions(
        context,
        args.orgId,
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
