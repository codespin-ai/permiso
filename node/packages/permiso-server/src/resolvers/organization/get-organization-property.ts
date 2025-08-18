import type { Database } from "@codespin/permiso-db";
import { getOrganizationProperty } from "../../domain/organization/get-organization-property.js";

export const getOrganizationPropertyResolver = {
  Query: {
    organizationProperty: async (
      _: any,
      args: { orgId: string; propertyName: string },
      context: { db: Database },
    ) => {
      const result = await getOrganizationProperty(
        context.db,
        args.orgId,
        args.propertyName,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
