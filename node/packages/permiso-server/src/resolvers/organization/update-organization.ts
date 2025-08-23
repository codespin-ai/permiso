import { updateOrganization } from "../../domain/organization/update-organization.js";
import { getOrganization } from "../../domain/organization/get-organization.js";
import { DataContext } from "../../domain/data-context.js";

export const updateOrganizationResolver = {
  Mutation: {
    updateOrganization: async (
      _: any,
      args: { id: string; input: any },
      context: DataContext,
    ) => {
      const result = await updateOrganization(context, args.id, args.input);
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const orgResult = await getOrganization(context, args.id);
      if (!orgResult.success) {
        throw orgResult.error;
      }
      return orgResult.data;
    },
  },
};
