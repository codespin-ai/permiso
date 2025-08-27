import type { RoleWithProperties } from "../../types.js";
import { getRoleProperties } from "../../domain/role/get-role-properties.js";
import { getRoleUsers } from "../../domain/role/get-role-users.js";
import { getUsers } from "../../domain/user/get-users.js";
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
      const userIdsResult = await getRoleUsers(context, parent.id);
      if (!userIdsResult.success) {
        throw userIdsResult.error;
      }

      if (userIdsResult.data.length === 0) {
        return [];
      }

      const result = await getUsers(context, {
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
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
