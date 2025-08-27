import { deleteOrganizationProperty } from "../../domain/organization/delete-organization-property.js";
import { DataContext } from "../../domain/data-context.js";

export const deleteOrganizationPropertyResolver = {
  Mutation: {
    deleteOrganizationProperty: async (
      _: unknown,
      args: { orgId: string; name: string },
      context: DataContext,
    ) => {
      const result = await deleteOrganizationProperty(
        context,
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
