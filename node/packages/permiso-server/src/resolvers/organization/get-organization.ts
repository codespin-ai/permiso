import type { Database } from "@codespin/permiso-db";
import { getOrganization } from "../../domain/organization/get-organization.js";

export const getOrganizationResolver = {
  Query: {
    organization: async (
      _: any,
      args: { id: string },
      context: { db: Database },
    ) => {
      const result = await getOrganization(context.db, args.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
