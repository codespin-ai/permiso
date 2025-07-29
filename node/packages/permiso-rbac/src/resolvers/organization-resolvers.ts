import { createLogger } from '@codespin/permiso-logger';
import type { Database } from '../db.js';
import * as persistence from '../persistence/index.js';
import type { OrganizationWithProperties, UserWithProperties, RoleWithProperties, Resource } from '../types.js';

const logger = createLogger('permiso-rbac:organization-resolvers');

export const organizationResolvers = {
  Query: {
    organization: async (_: any, args: { id: string }, context: { db: Database }) => {
      const result = await persistence.getOrganization(context.db, args.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    organizations: async (_: any, args: { filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await persistence.getOrganizations(context.db, args.filter, args.pagination);
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

    organizationsByIds: async (_: any, args: { ids: string[] }, context: { db: Database }) => {
      const result = await persistence.getOrganizations(context.db, { ids: args.ids });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    organizationProperty: async (_: any, args: { orgId: string; propertyName: string }, context: { db: Database }) => {
      const result = await persistence.getOrganizationProperty(context.db, args.orgId, args.propertyName);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  Mutation: {
    createOrganization: async (_: any, args: { input: any }, context: { db: Database }) => {
      const result = await persistence.createOrganization(context.db, args.input);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch with properties
      const orgResult = await persistence.getOrganization(context.db, result.data.id);
      if (!orgResult.success) {
        throw orgResult.error;
      }
      return orgResult.data;
    },

    updateOrganization: async (_: any, args: { id: string; input: any }, context: { db: Database }) => {
      const result = await persistence.updateOrganization(context.db, args.id, args.input);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch with properties
      const orgResult = await persistence.getOrganization(context.db, args.id);
      if (!orgResult.success) {
        throw orgResult.error;
      }
      return orgResult.data;
    },

    deleteOrganization: async (_: any, args: { id: string; safetyKey?: string }, context: { db: Database; safetyKey?: string }) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error('Invalid safety key');
      }
      
      const result = await persistence.deleteOrganization(context.db, args.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    setOrganizationProperty: async (_: any, args: { orgId: string; name: string; value: string; hidden?: boolean }, context: { db: Database }) => {
      const result = await persistence.setOrganizationProperty(context.db, args.orgId, args.name, args.value, args.hidden ?? false);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    deleteOrganizationProperty: async (_: any, args: { orgId: string; name: string }, context: { db: Database }) => {
      const result = await persistence.deleteOrganizationProperty(context.db, args.orgId, args.name);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  },

  Organization: {
    properties: (parent: OrganizationWithProperties) => {
      return Object.entries(parent.properties).map(([name, value]) => ({
        name,
        value,
        hidden: false,
        createdAt: new Date()
      }));
    },

    users: async (parent: OrganizationWithProperties, args: { filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await persistence.getUsers(context.db, parent.id, args.filter, args.pagination);
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

    roles: async (parent: OrganizationWithProperties, args: { filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await persistence.getRoles(context.db, parent.id, args.filter, args.pagination);
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

    resources: async (parent: OrganizationWithProperties, args: { filter?: any; pagination?: any }, context: { db: Database }) => {
      let result;
      if (args.filter?.pathPrefix) {
        result = await persistence.getResourcesByPathPrefix(context.db, parent.id, args.filter.pathPrefix);
      } else {
        result = await persistence.getResources(context.db, parent.id, args.pagination);
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
    }
  }
};