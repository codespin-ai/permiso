import type { Database } from '@codespin/permiso-db';
import * as persistence from '../persistence/index.js';
import type { Resource, UserPermission, RolePermission } from '../types.js';

export const resourceResolvers = {
  Query: {
    resource: async (_: any, args: { orgId: string; resourceId: string }, context: { db: Database }) => {
      const result = await persistence.getResource(context.db, args.orgId, args.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resources: async (_: any, args: { orgId: string; filter?: any; pagination?: any }, context: { db: Database }) => {
      let result;
      if (args.filter?.idPrefix) {
        result = await persistence.getResourcesByIdPrefix(context.db, args.orgId, args.filter.idPrefix);
      } else {
        result = await persistence.getResources(context.db, args.orgId, args.pagination);
      }
      
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

    resourcesByIdPrefix: async (_: any, args: { orgId: string; idPrefix: string }, context: { db: Database }) => {
      const result = await persistence.getResourcesByIdPrefix(context.db, args.orgId, args.idPrefix);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  Mutation: {
    createResource: async (_: any, args: { input: any }, context: { db: Database }) => {
      const result = await persistence.createResource(context.db, args.input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    updateResource: async (_: any, args: { orgId: string; resourceId: string; input: any }, context: { db: Database }) => {
      const result = await persistence.updateResource(context.db, args.orgId, args.resourceId, args.input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    deleteResource: async (_: any, args: { orgId: string; resourceId: string }, context: { db: Database }) => {
      const result = await persistence.deleteResource(context.db, args.orgId, args.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  Resource: {
    organization: async (parent: Resource, _: any, context: { db: Database }) => {
      const result = await persistence.getOrganization(context.db, parent.orgId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    permissions: async (parent: Resource, _: any, context: { db: Database }) => {
      // Get all user permissions for this resource
      const userPermsResult = await context.db.manyOrNone<any>(
        `SELECT * FROM user_permission WHERE org_id = $(orgId) AND resource_id = $(resourceId)`,
        { orgId: parent.orgId, resourceId: parent.id }
      );
      
      // Get all role permissions for this resource
      const rolePermsResult = await context.db.manyOrNone<any>(
        `SELECT * FROM role_permission WHERE org_id = $(orgId) AND resource_id = $(resourceId)`,
        { orgId: parent.orgId, resourceId: parent.id }
      );
      
      // Map to UserPermission and RolePermission types
      const userPermissions: UserPermission[] = userPermsResult.map((p: any) => ({
        __typename: 'UserPermission' as const,
        userId: p.user_id,
        resourceId: p.resource_id,
        action: p.action,
        createdAt: p.created_at,
        // These will be populated by GraphQL resolvers
        organization: null as any,
        resource: null as any,
        user: null as any
      }));
      
      const rolePermissions: RolePermission[] = rolePermsResult.map((p: any) => ({
        __typename: 'RolePermission' as const,
        roleId: p.role_id,
        resourceId: p.resource_id,
        action: p.action,
        createdAt: p.created_at,
        // These will be populated by GraphQL resolvers
        organization: null as any,
        resource: null as any,
        role: null as any
      }));
      
      return [...userPermissions, ...rolePermissions];
    }
  }
};