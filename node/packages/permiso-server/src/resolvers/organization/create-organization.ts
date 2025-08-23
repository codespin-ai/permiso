import type { Database } from "@codespin/permiso-db";
import { createOrganization } from "../../domain/organization/create-organization.js";
import { getOrganization } from "../../domain/organization/get-organization.js";

export const createOrganizationResolver = {
  Mutation: {
    createOrganization: async (
      _: any,
      args: { input: any },
      context: { db: Database },
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
