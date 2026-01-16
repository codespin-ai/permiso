import type { RoleWithProperties } from "../../types.js";
import { getRoleProperties } from "../../domain/role/get-role-properties.js";
import { getRoleUsersByOrg } from "../../domain/role/get-role-users-by-org.js";
import { getUsersByOrg } from "../../domain/user/get-users-by-org.js";
import { getRolePermissions } from "../../domain/permission/get-role-permissions.js";
import { getOrganization } from "../../domain/organization/get-organization.js";
import { DataContext } from "../../domain/data-context.js";

export const roleFieldResolvers = {
  Role: {
    organization: async (
      parent: RoleWithProperties,
      _: unknown,
      context: DataContext,
    ) => {
      const result = await getOrganization(context, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    properties: async (
      parent: RoleWithProperties,
      _: unknown,
      context: DataContext,
    ) => {
      const result = await getRoleProperties(context, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    users: async (
      parent: RoleWithProperties,
      _: unknown,
      context: DataContext,
    ) => {
      // Use parent.orgId instead of context.orgId to work with ROOT queries
      const userIdsResult = await getRoleUsersByOrg(
        context,
        parent.orgId,
        parent.id,
      );
      if (!userIdsResult.success) {
        throw userIdsResult.error;
      }

      if (userIdsResult.data.length === 0) {
        return [];
      }

      const result = await getUsersByOrg(context, parent.orgId, {
        ids: userIdsResult.data,
      });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    permissions: async (
      parent: RoleWithProperties,
      args: { resourcePath?: string },
      context: DataContext,
    ) => {
      const result = await getRolePermissions(
        context,
        parent.id,
        args.resourcePath,
        undefined,
        parent.orgId,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
