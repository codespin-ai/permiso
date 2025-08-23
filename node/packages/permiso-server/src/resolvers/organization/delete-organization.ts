import { deleteOrganization } from "../../domain/organization/delete-organization.js";
import { DataContext } from "../../domain/data-context.js";

export const deleteOrganizationResolver = {
  Mutation: {
    deleteOrganization: async (
      _: any,
      args: { id: string; safetyKey?: string },
      context: DataContext,
    ) => {
      // If safetyKey is provided, it must match the organization ID
      if (args.safetyKey !== undefined && args.safetyKey !== args.id) {
        throw new Error("Invalid safety key - must match organization ID");
      }

      const result = await deleteOrganization(context, args.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
