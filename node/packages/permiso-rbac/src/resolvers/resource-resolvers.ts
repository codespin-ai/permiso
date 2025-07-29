import type { Database } from '../db.js';
import * as persistence from '../persistence/index.js';
import type { Resource, Permission } from '../types.js';

export const resourceResolvers = {
  Query: {
    resource: async (_: any, args: { orgId: string; resourcePath: string }, context: { db: Database }) => {
      const result = await persistence.getResource(context.db, args.orgId, args.resourcePath);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    resources: async (_: any, args: { orgId: string; filter?: any; pagination?: any }, context: { db: Database }) => {
      let result;
      if (args.filter?.pathPrefix) {
        result = await persistence.getResourcesByPathPrefix(context.db, args.orgId, args.filter.pathPrefix);
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

    resourcesByPathPrefix: async (_: any, args: { orgId: string; pathPrefix: string }, context: { db: Database }) => {
      const result = await persistence.getResourcesByPathPrefix(context.db, args.orgId, args.pathPrefix);
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

    updateResource: async (_: any, args: { orgId: string; resourcePath: string; input: any }, context: { db: Database }) => {
      const result = await persistence.updateResource(context.db, args.orgId, args.resourcePath, args.input);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    deleteResource: async (_: any, args: { orgId: string; resourcePath: string }, context: { db: Database }) => {
      const result = await persistence.deleteResource(context.db, args.orgId, args.resourcePath);
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
      const userPermsResult = await context.db.manyOrNone(
        `SELECT * FROM user_permission WHERE org_id = $1 AND resource_id = $2`,
        [parent.orgId, parent.id]
      );
      
      // Get all role permissions for this resource
      const rolePermsResult = await context.db.manyOrNone(
        `SELECT * FROM role_permission WHERE org_id = $1 AND resource_id = $2`,
        [parent.orgId, parent.id]
      );
      
      const permissions: Permission[] = [
        ...userPermsResult.map((p: any) => ({
          userId: p.user_id,
          orgId: p.org_id,
          resourceId: p.resource_id,
          action: p.action,
          createdAt: p.created_at
        })),
        ...rolePermsResult.map((p: any) => ({
          roleId: p.role_id,
          orgId: p.org_id,
          resourceId: p.resource_id,
          action: p.action,
          createdAt: p.created_at
        }))
      ];
      
      return permissions;
    }
  }
};