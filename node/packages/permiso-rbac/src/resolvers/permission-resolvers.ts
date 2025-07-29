import type { Database } from '@codespin/permiso-db';
import * as persistence from '../persistence/index.js';
import type { UserPermission, RolePermission } from '../types.js';

export const permissionResolvers = {
  Query: {
    userPermissions: async (_: any, args: { orgId: string; userId: string; resourcePath?: string; action?: string }, context: { db: Database }) => {
      const result = await persistence.getUserPermissions(context.db, args.orgId, args.userId, args.resourcePath, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    rolePermissions: async (_: any, args: { orgId: string; roleId: string; resourcePath?: string; action?: string }, context: { db: Database }) => {
      const result = await persistence.getRolePermissions(context.db, args.orgId, args.roleId, args.resourcePath, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    effectivePermissions: async (_: any, args: { orgId: string; userId: string; resourcePath: string; action?: string }, context: { db: Database }) => {
      const result = await persistence.getEffectivePermissions(context.db, args.orgId, args.userId, args.resourcePath, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    effectivePermissionsByPrefix: async (_: any, args: { orgId: string; userId: string; resourcePathPrefix: string; action?: string }, context: { db: Database }) => {
      const result = await persistence.getEffectivePermissionsByPrefix(context.db, args.orgId, args.userId, args.resourcePathPrefix, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    hasPermission: async (_: any, args: { orgId: string; userId: string; resourcePath: string; action: string }, context: { db: Database }) => {
      const result = await persistence.hasPermission(context.db, args.orgId, args.userId, args.resourcePath, args.action);
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
        args.input.resourcePath,
        args.input.action
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    revokeUserPermission: async (_: any, args: { orgId: string; userId: string; resourcePath: string; action: string }, context: { db: Database }) => {
      const result = await persistence.revokeUserPermission(context.db, args.orgId, args.userId, args.resourcePath, args.action);
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
        args.input.resourcePath,
        args.input.action
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    revokeRolePermission: async (_: any, args: { orgId: string; roleId: string; resourcePath: string; action: string }, context: { db: Database }) => {
      const result = await persistence.revokeRolePermission(context.db, args.orgId, args.roleId, args.resourcePath, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  UserPermission: {
    organization: async (parent: UserPermission, _: any, context: { db: Database }) => {
      const result = await persistence.getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resource: async (parent: UserPermission, _: any, context: { db: Database }) => {
      const result = await persistence.getResource(context.db, parent.orgId, parent.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    user: async (parent: UserPermission, _: any, context: { db: Database }) => {
      const result = await persistence.getUser(context.db, parent.orgId, parent.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  RolePermission: {
    organization: async (parent: RolePermission, _: any, context: { db: Database }) => {
      const result = await persistence.getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resource: async (parent: RolePermission, _: any, context: { db: Database }) => {
      const result = await persistence.getResource(context.db, parent.orgId, parent.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    role: async (parent: RolePermission, _: any, context: { db: Database }) => {
      const result = await persistence.getRole(context.db, parent.orgId, parent.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};