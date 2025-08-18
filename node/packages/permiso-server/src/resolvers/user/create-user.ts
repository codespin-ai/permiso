import type { Database } from "@codespin/permiso-db";
import { createUser } from "../../domain/user/create-user.js";
import { getUser } from "./get-user.js";

// Re-export domain function
export { createUser };

export const createUserResolver = {
  Mutation: {
    createUser: async (
      _: any,
      args: { input: any },
      context: { db: Database },
    ) => {
      const result = await createUser(context.db, args.input);
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const userResult = await getUser(
        context.db,
        args.input.orgId,
        result.data.id,
      );
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },
  },
};
