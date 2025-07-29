import type { Database } from '@codespin/permiso-db';
import * as persistence from '../persistence/index.js';
import type { UserWithProperties } from '../types.js';

export const userResolvers = {
  Query: {
    user: async (_: any, args: { orgId: string; userId: string }, context: { db: Database }) => {
      const result = await persistence.getUser(context.db, args.orgId, args.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    users: async (_: any, args: { orgId: string; filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await persistence.getUsers(context.db, args.orgId, args.filter, args.pagination);
      if (!result.success) {
        throw result.error;
      }
      return {
        nodes: result.data,
        totalCount: result.data.length,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null
        }
      };
    },

    usersByIds: async (_: any, args: { orgId: string; ids: string[] }, context: { db: Database }) => {
      const result = await persistence.getUsers(context.db, args.orgId, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    usersByIdentity: async (_: any, args: { identityProvider: string; identityProviderUserId: string }, context: { db: Database }) => {
      const result = await persistence.getUsersByIdentity(context.db, args.identityProvider, args.identityProviderUserId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    userProperty: async (_: any, args: { orgId: string; userId: string; propertyName: string }, context: { db: Database }) => {
      const result = await persistence.getUserProperty(context.db, args.orgId, args.userId, args.propertyName);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  Mutation: {
    createUser: async (_: any, args: { input: any }, context: { db: Database }) => {
      const result = await persistence.createUser(context.db, args.input);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch with properties and roles
      const userResult = await persistence.getUser(context.db, args.input.orgId, result.data.id);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },

    updateUser: async (_: any, args: { orgId: string; userId: string; input: any }, context: { db: Database }) => {
      const result = await persistence.updateUser(context.db, args.orgId, args.userId, args.input);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch with properties and roles
      const userResult = await persistence.getUser(context.db, args.orgId, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },

    deleteUser: async (_: any, args: { orgId: string; userId: string }, context: { db: Database }) => {
      const result = await persistence.deleteUser(context.db, args.orgId, args.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    setUserProperty: async (_: any, args: { orgId: string; userId: string; name: string; value: string; hidden?: boolean }, context: { db: Database }) => {
      const result = await persistence.setUserProperty(context.db, args.orgId, args.userId, args.name, args.value, args.hidden ?? false);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    deleteUserProperty: async (_: any, args: { orgId: string; userId: string; name: string }, context: { db: Database }) => {
      const result = await persistence.deleteUserProperty(context.db, args.orgId, args.userId, args.name);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    assignUserRole: async (_: any, args: { orgId: string; userId: string; roleId: string }, context: { db: Database }) => {
      const result = await persistence.assignUserRole(context.db, args.orgId, args.userId, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch updated user
      const userResult = await persistence.getUser(context.db, args.orgId, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    },

    unassignUserRole: async (_: any, args: { orgId: string; userId: string; roleId: string }, context: { db: Database }) => {
      const result = await persistence.unassignUserRole(context.db, args.orgId, args.userId, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch updated user
      const userResult = await persistence.getUser(context.db, args.orgId, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    }
  },

  User: {
    properties: (parent: UserWithProperties) => {
      return Object.entries(parent.properties).map(([name, value]) => ({
        name,
        value,
        hidden: false,
        createdAt: new Date()
      }));
    },

    organization: async (parent: UserWithProperties, _: any, context: { db: Database }) => {
      const result = await persistence.getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    roles: async (parent: UserWithProperties, _: any, context: { db: Database }) => {
      if (!parent.roleIds || parent.roleIds.length === 0) {
        return [];
      }
      
      const result = await persistence.getRoles(context.db, parent.orgId, { ids: parent.roleIds });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    permissions: async (parent: UserWithProperties, _: any, context: { db: Database }) => {
      const result = await persistence.getUserPermissions(context.db, parent.orgId, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    effectivePermissions: async (parent: UserWithProperties, args: { resourcePath?: string; action?: string }, context: { db: Database }) => {
      if (!args.resourcePath) {
        return [];
      }
      
      const result = await persistence.getEffectivePermissions(context.db, parent.orgId, parent.id, args.resourcePath, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};