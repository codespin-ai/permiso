import { deleteUserProperty } from "../../domain/user/delete-user-property.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { deleteUserProperty };

export const deleteUserPropertyResolver = {
  Mutation: {
    deleteUserProperty: async (
      _: unknown,
      args: { userId: string; name: string },
      context: DataContext,
    ) => {
      const result = await deleteUserProperty(context, args.userId, args.name);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
