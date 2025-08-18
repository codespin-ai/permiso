import type { Database } from "@codespin/permiso-db";
import { deleteUserProperty } from "../../domain/user/delete-user-property.js";

// Re-export domain function
export { deleteUserProperty };

export const deleteUserPropertyResolver = {
  Mutation: {
    deleteUserProperty: async (
      _: any,
      args: { orgId: string; userId: string; name: string },
      context: { db: Database },
    ) => {
      const result = await deleteUserProperty(
        context.db,
        args.orgId,
        args.userId,
        args.name,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
