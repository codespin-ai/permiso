import { getOrganizationProperty } from "../../domain/organization/get-organization-property.js";
import { DataContext } from "../../domain/data-context.js";

export const getOrganizationPropertyResolver = {
  Query: {
    organizationProperty: async (
      _: any,
      args: { orgId: string; propertyName: string },
      context: DataContext,
    ) => {
      const result = await getOrganizationProperty(
        context,
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
