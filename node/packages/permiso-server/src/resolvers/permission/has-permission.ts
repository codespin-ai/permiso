import { hasPermission } from "../../domain/permission/has-permission.js";
import { DataContext } from "../../domain/data-context.js";

export const hasPermissionResolver = {
  Query: {
    hasPermission: async (
      _: any,
      args: {
        orgId: string;
        userId: string;
        resourcePath: string;
        action: string;
      },
      context: DataContext,
    ) => {
      const result = await hasPermission(
        context,
        args.userId,
        args.resourcePath,
        args.action,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
