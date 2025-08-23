import type { Database } from "@codespin/permiso-db";
import type { RoleWithProperties } from "../../types.js";
import { getRoleProperties } from "../../domain/role/get-role-properties.js";
import { getRoleUsers } from "../../domain/role/get-role-users.js";
import { getUsers } from "../../domain/user/get-users.js";
import { getRolePermissions } from "../../domain/permission/get-role-permissions.js";
import { getOrganization } from "../../domain/organization/get-organization.js";

export const roleFieldResolvers = {
  Role: {
    organization: async (
      parent: RoleWithProperties,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getOrganization(context, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    properties: async (
      parent: RoleWithProperties,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getRoleProperties(context, parent.orgId, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    users: async (
      parent: RoleWithProperties,
      _: any,
      context: { db: Database },
    ) => {
      const userIdsResult = await getRoleUsers(
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

      const result = await getUsers(context, parent.orgId, {
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
      context: { db: Database },
    ) => {
      const result = await getRolePermissions(
        context,
        parent.orgId,
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
