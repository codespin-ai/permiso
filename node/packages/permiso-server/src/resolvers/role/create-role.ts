import type { Database } from "@codespin/permiso-db";
import { createRole } from "../../domain/role/create-role.js";
import { getRole } from "./get-role.js";

// Re-export domain function
export { createRole };

export const createRoleResolver = {
  Mutation: {
    createRole: async (
      _: any,
      args: { input: any },
      context: { db: Database },
    ) => {
      const result = await createRole(context.db, args.input);
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const roleResult = await getRole(
        context.db,
        args.input.orgId,
        result.data.id,
      );
      if (!roleResult.success) {
        throw roleResult.error;
      }
      return roleResult.data;
    },
  },
};
