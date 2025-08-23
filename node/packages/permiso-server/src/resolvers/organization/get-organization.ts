import { getOrganization } from "../../domain/organization/get-organization.js";
import { DataContext } from "../../domain/data-context.js";

export const getOrganizationResolver = {
  Query: {
    organization: async (
      _: any,
      args: { id: string },
      context: DataContext,
    ) => {
      const result = await getOrganization(context, args.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
