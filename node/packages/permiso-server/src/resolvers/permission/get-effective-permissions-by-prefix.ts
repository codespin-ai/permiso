import { getEffectivePermissionsByPrefix } from "../../domain/permission/get-effective-permissions-by-prefix.js";
import { DataContext } from "../../domain/data-context.js";

export const getEffectivePermissionsByPrefixResolver = {
  Query: {
    effectivePermissionsByPrefix: async (
      _: any,
      args: {
        orgId: string;
        userId: string;
        resourceIdPrefix: string;
        action?: string;
      },
      context: DataContext,
    ) => {
      const result = await getEffectivePermissionsByPrefix(
        context,
        args.orgId,
        args.userId,
        args.resourceIdPrefix,
        args.action,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
