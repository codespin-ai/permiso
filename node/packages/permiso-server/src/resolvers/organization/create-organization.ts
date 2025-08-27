import { createOrganization } from "../../domain/organization/create-organization.js";
import { getOrganization } from "../../domain/organization/get-organization.js";
import { DataContext } from "../../domain/data-context.js";
import type { CreateOrganizationInput } from "../../generated/graphql.js";

export const createOrganizationResolver = {
  Mutation: {
    createOrganization: async (
      _: unknown,
      args: { input: CreateOrganizationInput },
      context: DataContext,
    ) => {
      const result = await createOrganization(context, args.input);
      if (!result.success) {
        throw result.error;
      }

      // Fetch with properties
      const orgResult = await getOrganization(context, result.data.id);
      if (!orgResult.success) {
        throw orgResult.error;
      }
      return orgResult.data;
    },
  },
};
