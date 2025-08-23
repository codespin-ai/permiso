import { setOrganizationProperty } from "../../domain/organization/set-organization-property.js";
import { DataContext } from "../../domain/data-context.js";

export const setOrganizationPropertyResolver = {
  Mutation: {
    setOrganizationProperty: async (
      _: any,
      args: { orgId: string; name: string; value: unknown; hidden?: boolean },
      context: DataContext,
    ) => {
      const result = await setOrganizationProperty(
        context,
        args.orgId,
        args.name,
        args.value,
        args.hidden ?? false,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
