import type { Database } from "@codespin/permiso-db";
import { hasPermission } from "../../domain/permission/has-permission.js";

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
      context: { db: Database },
    ) => {
      const result = await hasPermission(
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
