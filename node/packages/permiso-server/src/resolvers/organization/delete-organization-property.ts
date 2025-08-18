import type { Database } from "@codespin/permiso-db";
import { deleteOrganizationProperty } from "../../domain/organization/delete-organization-property.js";

export const deleteOrganizationPropertyResolver = {
  Mutation: {
    deleteOrganizationProperty: async (
      _: any,
      args: { orgId: string; name: string },
      context: { db: Database },
    ) => {
      const result = await deleteOrganizationProperty(
        context.db,
        args.orgId,
        args.name,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
