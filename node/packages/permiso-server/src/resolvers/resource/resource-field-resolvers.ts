import type { Resource } from "../../types.js";
import { getOrganization } from "../../domain/organization/get-organization.js";
import { getPermissionsByResource } from "../../domain/permission/get-permissions-by-resource.js";
import { DataContext } from "../../domain/data-context.js";

export const resourceFieldResolvers = {
  Resource: {
    organization: async (parent: Resource, _: any, context: DataContext) => {
      const result = await getOrganization(context, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    permissions: async (parent: Resource, _: any, context: DataContext) => {
      const result = await getPermissionsByResource(
        context,
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
