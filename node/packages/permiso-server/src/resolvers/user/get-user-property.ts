import { getUserProperty } from "../../domain/user/get-user-property.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { getUserProperty };

export const getUserPropertyResolver = {
  Query: {
    userProperty: async (
      _: any,
      args: { userId: string; propertyName: string },
      context: DataContext,
    ) => {
      const result = await getUserProperty(
        context,
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
