import { getEffectivePermissions } from "../../domain/permission/get-effective-permissions.js";
import { DataContext } from "../../domain/data-context.js";

export const getEffectivePermissionsResolver = {
  Query: {
    effectivePermissions: async (
      _: any,
      args: {
        orgId: string;
        userId: string;
        resourcePath?: string;
        action?: string;
      },
      context: DataContext,
    ) => {
      const result = await getEffectivePermissions(
        context,
        args.orgId,
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
