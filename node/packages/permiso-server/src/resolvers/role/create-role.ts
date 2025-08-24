import { createRole } from "../../domain/role/create-role.js";
import { getRole } from "./get-role.js";
import { DataContext } from "../../domain/data-context.js";

// Re-export domain function
export { createRole };

export const createRoleResolver = {
  Mutation: {
    createRole: async (_: any, args: { input: any }, context: DataContext) => {
      const result = await createRole(context, args.input);
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const roleResult = await getRole(
        context,
        result.data.id,
      );
      if (!roleResult.success) {
        throw roleResult.error;
      }
      return roleResult.data;
    },
  },
};
