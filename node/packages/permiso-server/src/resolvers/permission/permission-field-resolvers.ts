import type {
  UserPermissionWithOrgId,
  RolePermissionWithOrgId,
} from "../../types.js";
import { getOrganization } from "../../domain/organization/get-organization.js";
import { getResource } from "../../domain/resource/get-resource.js";
import { getUser } from "../../domain/user/get-user.js";
import { getRole } from "../../domain/role/get-role.js";
import { DataContext } from "../../domain/data-context.js";

export const permissionFieldResolvers = {
  UserPermission: {
    organization: async (
      parent: UserPermissionWithOrgId,
      _: unknown,
      context: DataContext,
    ) => {
      const result = await getOrganization(context, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resource: async (
      parent: UserPermissionWithOrgId,
      _: unknown,
      context: DataContext,
    ) => {
      const result = await getResource(context, parent.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    user: async (
      parent: UserPermissionWithOrgId,
      _: unknown,
      context: DataContext,
    ) => {
      const result = await getUser(context, parent.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },

  RolePermission: {
    organization: async (
      parent: RolePermissionWithOrgId,
      _: unknown,
      context: DataContext,
    ) => {
      const result = await getOrganization(context, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resource: async (
      parent: RolePermissionWithOrgId,
      _: unknown,
      context: DataContext,
    ) => {
      const result = await getResource(context, parent.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    role: async (
      parent: RolePermissionWithOrgId,
      _: unknown,
      context: DataContext,
    ) => {
      const result = await getRole(context, parent.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },
  },
};
