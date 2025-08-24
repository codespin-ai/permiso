import { getUser } from "../../domain/user/get-user.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { getUser };

export const getUserResolver = {
  Query: {
    user: async (
      _: any,
      args: { userId: string },
      context: DataContext,
    ) => {
      const result = await getUser(context, args.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
