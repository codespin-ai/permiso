import type { Database } from '@codespin/permiso-db';
import type { RoleWithProperties } from '../../types.js';
import { getRoleProperties } from './get-role-properties.js';
import { getRoleUsers } from './get-role-users.js';
import { getUsers } from '../user/get-users.js';
import { getRolePermissions } from '../permission/get-role-permissions.js';

export const roleFieldResolvers = {
  Role: {
    properties: async (parent: RoleWithProperties, _: any, context: { db: Database }) => {
      const result = await getRoleProperties(context.db, parent.orgId, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    users: async (parent: RoleWithProperties, args: { pagination?: any }, context: { db: Database }) => {
      const userIdsResult = await getRoleUsers(context.db, parent.orgId, parent.id);
      if (!userIdsResult.success) {
        throw userIdsResult.error;
      }

      if (userIdsResult.data.length === 0) {
        return {
          nodes: [],
          totalCount: 0,
          pageInfo: {
            hasNextPage: false,
            hasPreviousPage: false,
            startCursor: null,
            endCursor: null
          }
        };
      }

      const result = await getUsers(context.db, parent.orgId, { ids: userIdsResult.data }, args.pagination);
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

    permissions: async (parent: RoleWithProperties, args: { resourcePath?: string }, context: { db: Database }) => {
      const result = await getRolePermissions(context.db, parent.orgId, parent.id, args.resourcePath);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};