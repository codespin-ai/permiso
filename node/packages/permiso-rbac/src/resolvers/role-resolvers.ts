import type { Database } from '../db.js';
import * as persistence from '../persistence/index.js';
import type { RoleWithProperties } from '../types.js';

export const roleResolvers = {
  Query: {
    role: async (_: any, args: { orgId: string; roleId: string }, context: { db: Database }) => {
      const result = await persistence.getRole(context.db, args.orgId, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    roles: async (_: any, args: { orgId: string; filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await persistence.getRoles(context.db, args.orgId, args.filter, args.pagination);
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

    rolesByIds: async (_: any, args: { orgId: string; ids: string[] }, context: { db: Database }) => {
      const result = await persistence.getRoles(context.db, args.orgId, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    roleProperty: async (_: any, args: { orgId: string; roleId: string; propertyName: string }, context: { db: Database }) => {
      const result = await persistence.getRoleProperty(context.db, args.orgId, args.roleId, args.propertyName);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  Mutation: {
    createRole: async (_: any, args: { input: any }, context: { db: Database }) => {
      const result = await persistence.createRole(context.db, args.input);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch with properties
      const roleResult = await persistence.getRole(context.db, args.input.orgId, result.data.id);
      if (!roleResult.success) {
        throw roleResult.error;
      }
      return roleResult.data;
    },

    updateRole: async (_: any, args: { orgId: string; roleId: string; input: any }, context: { db: Database }) => {
      const result = await persistence.updateRole(context.db, args.orgId, args.roleId, args.input);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch with properties
      const roleResult = await persistence.getRole(context.db, args.orgId, args.roleId);
      if (!roleResult.success) {
        throw roleResult.error;
      }
      return roleResult.data;
    },

    deleteRole: async (_: any, args: { orgId: string; roleId: string }, context: { db: Database }) => {
      const result = await persistence.deleteRole(context.db, args.orgId, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    setRoleProperty: async (_: any, args: { orgId: string; roleId: string; name: string; value: string; hidden?: boolean }, context: { db: Database }) => {
      const result = await persistence.setRoleProperty(context.db, args.orgId, args.roleId, args.name, args.value, args.hidden ?? false);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    deleteRoleProperty: async (_: any, args: { orgId: string; roleId: string; name: string }, context: { db: Database }) => {
      const result = await persistence.deleteRoleProperty(context.db, args.orgId, args.roleId, args.name);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  Role: {
    properties: (parent: RoleWithProperties) => {
      return Object.entries(parent.properties).map(([name, value]) => ({
        name,
        value,
        hidden: false,
        createdAt: new Date()
      }));
    },

    organization: async (parent: RoleWithProperties, _: any, context: { db: Database }) => {
      const result = await persistence.getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    users: async (parent: RoleWithProperties, _: any, context: { db: Database }) => {
      const userIdsResult = await persistence.getRoleUsers(context.db, parent.orgId, parent.id);
      if (!userIdsResult.success) {
        throw userIdsResult.error;
      }
      
      if (!userIdsResult.data || userIdsResult.data.length === 0) {
        return [];
      }
      
      const result = await persistence.getUsers(context.db, parent.orgId, { ids: userIdsResult.data });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    permissions: async (parent: RoleWithProperties, _: any, context: { db: Database }) => {
      const result = await persistence.getRolePermissions(context.db, parent.orgId, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};