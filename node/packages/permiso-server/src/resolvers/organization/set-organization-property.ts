import type { Database } from "@codespin/permiso-db";
import { setOrganizationProperty } from "../../domain/organization/set-organization-property.js";

export const setOrganizationPropertyResolver = {
  Mutation: {
    setOrganizationProperty: async (
      _: any,
      args: { orgId: string; name: string; value: unknown; hidden?: boolean },
      context: { db: Database },
    ) => {
      const result = await setOrganizationProperty(
        context.db,
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
