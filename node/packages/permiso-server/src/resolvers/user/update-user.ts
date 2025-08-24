import { updateUser } from "../../domain/user/update-user.js";
import { getUser } from "./get-user.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { updateUser };

export const updateUserResolver = {
  Mutation: {
    updateUser: async (
      _: any,
      args: { userId: string; input: any },
      context: DataContext,
    ) => {
      const result = await updateUser(context, args.userId, args.input);
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const userResult = await getUser(context, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },
  },
};
