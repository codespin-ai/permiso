import type { Database } from "@codespin/permiso-db";
import { getUser } from "../../domain/user/get-user.js";

// Re-export domain function
export { getUser };

export const getUserResolver = {
  Query: {
    user: async (
      _: any,
      args: { orgId: string; userId: string },
      context: { db: Database },
    ) => {
      const result = await getUser(context, args.orgId, args.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
