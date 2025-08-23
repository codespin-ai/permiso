import { deleteUser } from "../../domain/user/delete-user.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { deleteUser };

export const deleteUserResolver = {
  Mutation: {
    deleteUser: async (
      _: any,
      args: { orgId: string; userId: string; safetyKey?: string },
      context: DataContext & { safetyKey?: string },
    ) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error("Invalid safety key");
      }

      const result = await deleteUser(context, args.orgId, args.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
