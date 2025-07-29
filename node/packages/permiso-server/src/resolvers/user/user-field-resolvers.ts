import type { Database } from '@codespin/permiso-db';
import type { UserWithProperties } from '../../types.js';
import { getUserProperties } from './get-user-properties.js';
import { getRoles } from '../role/get-roles.js';
import { getEffectivePermissions } from '../permission/get-effective-permissions.js';

export const userFieldResolvers = {
  User: {
    properties: async (parent: UserWithProperties, _: any, context: { db: Database }) => {
      const result = await getUserProperties(context.db, parent.orgId, parent.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    roles: async (parent: UserWithProperties, _: any, context: { db: Database }) => {
      if (!parent.roleIds || parent.roleIds.length === 0) {
        return [];
      }
      
      const result = await getRoles(context.db, parent.orgId, { ids: parent.roleIds });
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    },

    effectivePermissions: async (
      parent: UserWithProperties,
      args: { resourcePath?: string },
      context: { db: Database }
    ) => {
      const result = await getEffectivePermissions(
        context.db,
        parent.orgId,
        parent.id,
        args.resourcePath
      );
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};