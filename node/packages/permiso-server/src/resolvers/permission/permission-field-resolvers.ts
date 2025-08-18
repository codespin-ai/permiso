import type { Database } from "@codespin/permiso-db";
import type {
  UserPermissionWithOrgId,
  RolePermissionWithOrgId,
} from "../../types.js";
import { getOrganization } from "../../domain/organization/get-organization.js";
import { getResource } from "../../domain/resource/get-resource.js";
import { getUser } from "../../domain/user/get-user.js";
import { getRole } from "../../domain/role/get-role.js";

export const permissionFieldResolvers = {
  UserPermission: {
    organization: async (
      parent: UserPermissionWithOrgId,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resource: async (
      parent: UserPermissionWithOrgId,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getResource(
        context.db,
        parent.orgId,
        parent.resourceId,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    user: async (
      parent: UserPermissionWithOrgId,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getUser(context.db, parent.orgId, parent.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },

  RolePermission: {
    organization: async (
      parent: RolePermissionWithOrgId,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resource: async (
      parent: RolePermissionWithOrgId,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getResource(
        context.db,
        parent.orgId,
        parent.resourceId,
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    role: async (
      parent: RolePermissionWithOrgId,
      _: any,
      context: { db: Database },
    ) => {
      const result = await getRole(context.db, parent.orgId, parent.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
