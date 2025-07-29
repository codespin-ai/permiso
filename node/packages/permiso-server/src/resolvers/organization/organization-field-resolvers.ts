import type { Database } from '@codespin/permiso-db';
import type { OrganizationWithProperties } from '../../types.js';
import { getOrganizationProperties } from './get-organization-properties.js';
import { getUsers } from '../user/get-users.js';
import { getRoles } from '../role/get-roles.js';
import { getResources, getResourcesByIdPrefix } from '../resource/get-resources.js';

export const organizationFieldResolvers = {
  Organization: {
    properties: async (parent: OrganizationWithProperties, _: any, context: { db: Database }) => {
      const result = await getOrganizationProperties(context.db, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    users: async (parent: OrganizationWithProperties, args: { filter?: any; pagination?: any }, context: { db: Database }) => {
      const result = await getUsers(context.db, parent.id, args.filter, args.pagination);
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
      const result = await getRoles(context.db, parent.id, args.filter, args.pagination);
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
      if (args.filter?.idPrefix) {
        result = await getResourcesByIdPrefix(context.db, parent.id, args.filter.idPrefix);
      } else {
        result = await getResources(context.db, parent.id, args.pagination);
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