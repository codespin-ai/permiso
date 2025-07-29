import type { Database } from '@codespin/permiso-db';
import type { Resource } from '../../types.js';
import { getOrganization } from '../../domain/organization/get-organization.js';

export const resourceFieldResolvers = {
  Resource: {
    organization: async (parent: Resource, _: any, context: { db: Database }) => {
      const result = await getOrganization(context.db, parent.orgId);
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

      return [
        ...userPermsResult.map((p: any) => ({
          __typename: 'UserPermission',
          userId: p.user_id,
          resourceId: p.resource_id,
          action: p.action,
          createdAt: p.created_at,
          orgId: p.org_id
        })),
        ...rolePermsResult.map((p: any) => ({
          __typename: 'RolePermission',
          roleId: p.role_id,
          resourceId: p.resource_id,
          action: p.action,
          createdAt: p.created_at,
          orgId: p.org_id
        }))
      ];
    }
  }
};