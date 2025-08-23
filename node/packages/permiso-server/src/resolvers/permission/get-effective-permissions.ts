import type { Database } from "@codespin/permiso-db";
import { getEffectivePermissions } from "../../domain/permission/get-effective-permissions.js";

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
      context: { db: Database },
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
