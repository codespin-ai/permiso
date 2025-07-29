import type { Database } from '@codespin/permiso-db';
import * as persistence from '../persistence/index.js';
import type { UserPermissionWithOrgId, RolePermissionWithOrgId } from '../types.js';

export const permissionResolvers = {
  Query: {
    userPermissions: async (_: any, args: { orgId: string; userId: string; resourceId?: string; action?: string }, context: { db: Database }) => {
      const result = await persistence.getUserPermissions(context.db, args.orgId, args.userId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    rolePermissions: async (_: any, args: { orgId: string; roleId: string; resourceId?: string; action?: string }, context: { db: Database }) => {
      const result = await persistence.getRolePermissions(context.db, args.orgId, args.roleId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    effectivePermissions: async (_: any, args: { orgId: string; userId: string; resourceId: string; action?: string }, context: { db: Database }) => {
      const result = await persistence.getEffectivePermissions(context.db, args.orgId, args.userId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    effectivePermissionsByPrefix: async (_: any, args: { orgId: string; userId: string; resourceIdPrefix: string; action?: string }, context: { db: Database }) => {
      const result = await persistence.getEffectivePermissionsByPrefix(context.db, args.orgId, args.userId, args.resourceIdPrefix, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    hasPermission: async (_: any, args: { orgId: string; userId: string; resourceId: string; action: string }, context: { db: Database }) => {
      const result = await persistence.hasPermission(context.db, args.orgId, args.userId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  Mutation: {
    grantUserPermission: async (_: any, args: { input: any }, context: { db: Database }) => {
      const result = await persistence.grantUserPermission(
        context.db,
        args.input.orgId,
        args.input.userId,
        args.input.resourceId,
        args.input.action
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    revokeUserPermission: async (_: any, args: { orgId: string; userId: string; resourceId: string; action: string }, context: { db: Database }) => {
      const result = await persistence.revokeUserPermission(context.db, args.orgId, args.userId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    grantRolePermission: async (_: any, args: { input: any }, context: { db: Database }) => {
      const result = await persistence.grantRolePermission(
        context.db,
        args.input.orgId,
        args.input.roleId,
        args.input.resourceId,
        args.input.action
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    revokeRolePermission: async (_: any, args: { orgId: string; roleId: string; resourceId: string; action: string }, context: { db: Database }) => {
      const result = await persistence.revokeRolePermission(context.db, args.orgId, args.roleId, args.resourceId, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  UserPermission: {
    organization: async (parent: UserPermissionWithOrgId, _: any, context: { db: Database }) => {
      const result = await persistence.getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resource: async (parent: UserPermissionWithOrgId, _: any, context: { db: Database }) => {
      const result = await persistence.getResource(context.db, parent.orgId, parent.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    user: async (parent: UserPermissionWithOrgId, _: any, context: { db: Database }) => {
      const result = await persistence.getUser(context.db, parent.orgId, parent.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  RolePermission: {
    organization: async (parent: RolePermissionWithOrgId, _: any, context: { db: Database }) => {
      const result = await persistence.getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resource: async (parent: RolePermissionWithOrgId, _: any, context: { db: Database }) => {
      const result = await persistence.getResource(context.db, parent.orgId, parent.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    role: async (parent: RolePermissionWithOrgId, _: any, context: { db: Database }) => {
      const result = await persistence.getRole(context.db, parent.orgId, parent.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};