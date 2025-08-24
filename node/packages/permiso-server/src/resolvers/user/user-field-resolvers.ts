import type { UserWithProperties } from "../../types.js";
import { getUserProperties } from "../../domain/user/get-user-properties.js";
import { getRoles } from "../../domain/role/get-roles.js";
import { getEffectivePermissions } from "../../domain/permission/get-effective-permissions.js";
import { getOrganization } from "../../domain/organization/get-organization.js";
import { getUserPermissions } from "../../domain/permission/get-user-permissions.js";
import { DataContext } from "../../domain/data-context.js";

export const userFieldResolvers = {
  User: {
    organization: async (
      parent: UserWithProperties,
      _: any,
      context: DataContext,
    ) => {
      const result = await getOrganization(context, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    properties: async (
      parent: UserWithProperties,
      _: any,
      context: DataContext,
    ) => {
      const result = await getUserProperties(context, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    roles: async (parent: UserWithProperties, _: any, context: DataContext) => {
      if (!parent.roleIds || parent.roleIds.length === 0) {
        return [];
      }

      const result = await getRoles(context, {
        ids: parent.roleIds,
      });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    permissions: async (
      parent: UserWithProperties,
      _: any,
      context: DataContext,
    ) => {
      const result = await getUserPermissions(context, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    effectivePermissions: async (
      parent: UserWithProperties,
      args: { resourceId?: string; action?: string },
      context: DataContext,
    ) => {
      const result = await getEffectivePermissions(
        context,
        parent.id,
        args.resourceId,
        args.action,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
