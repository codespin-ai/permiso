import type { Database } from "@codespin/permiso-db";
import { updateUser } from "../../domain/user/update-user.js";
import { getUser } from "./get-user.js";

// Re-export domain function
export { updateUser };

export const updateUserResolver = {
  Mutation: {
    updateUser: async (
      _: any,
      args: { orgId: string; userId: string; input: any },
      context: { db: Database },
    ) => {
      const result = await updateUser(
        context,
        args.orgId,
        args.userId,
        args.input,
      );
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const userResult = await getUser(context, args.orgId, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },
  },
};
