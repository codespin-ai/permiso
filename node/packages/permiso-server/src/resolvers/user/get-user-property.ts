import type { Database } from "@codespin/permiso-db";
import { getUserProperty } from "../../domain/user/get-user-property.js";

// Re-export domain function
export { getUserProperty };

export const getUserPropertyResolver = {
  Query: {
    userProperty: async (
      _: any,
      args: { orgId: string; userId: string; propertyName: string },
      context: { db: Database },
    ) => {
      const result = await getUserProperty(
        context.db,
        args.orgId,
        args.userId,
        args.propertyName,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
