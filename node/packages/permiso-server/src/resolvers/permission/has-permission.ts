import { hasPermission } from "../../domain/permission/has-permission.js";
import { DataContext } from "../../domain/data-context.js";

export const hasPermissionResolver = {
  Query: {
    hasPermission: async (
      _: unknown,
      args: {
        userId: string;
        resourceId: string;
        action: string;
      },
      context: DataContext,
    ) => {
      const result = await hasPermission(
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
