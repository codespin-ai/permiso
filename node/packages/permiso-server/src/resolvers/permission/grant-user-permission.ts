import { grantUserPermission } from "../../domain/permission/grant-user-permission.js";
import { DataContext } from "../../domain/data-context.js";

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
      context: DataContext,
    ) => {
      const result = await grantUserPermission(
        context,
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
