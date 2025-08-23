import type { Database } from "@codespin/permiso-db";
import type { Resource } from "../../types.js";
import { getOrganization } from "../../domain/organization/get-organization.js";
import { getPermissionsByResource } from "../../domain/permission/get-permissions-by-resource.js";

export const resourceFieldResolvers = {
  Resource: {
    organization: async (
      parent: Resource,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    permissions: async (
      parent: Resource,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getPermissionsByResource(
        context.db,
        parent.orgId,
        parent.id,
      );

      if (!result.success) {
        throw result.error;
      }

      return result.data;
    },
  },
};
