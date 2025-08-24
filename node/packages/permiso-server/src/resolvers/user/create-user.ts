import { createUser } from "../../domain/user/create-user.js";
import { getUser } from "./get-user.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { createUser };

export const createUserResolver = {
  Mutation: {
    createUser: async (_: any, args: { input: any }, context: DataContext) => {
      const result = await createUser(context, args.input);
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const userResult = await getUser(
        context,
        result.data.id,
      );
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },
  },
};
