import type { Database } from "@codespin/permiso-db";
import { grantUserPermission } from "../../domain/permission/grant-user-permission.js";

export const grantUserPermissionResolver = {
  Mutation: {
    grantUserPermission: async (
      _: any,
      args: {
        input: {
          orgId: string;
          userId: string;
          resourceId: string;
          action: string;
        };
      },
      context: { db: Database },
    ) => {
      const result = await grantUserPermission(
        context,
        args.input.orgId,
        args.input.userId,
        args.input.resourceId,
        args.input.action,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
