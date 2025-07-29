import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  EffectivePermission
} from '../../types.js';

const logger = createLogger('permiso-server:permissions');

export async function getEffectivePermissions(
  db: Database,
  orgId: string,
  userId: string,
  resourceId?: string,
  action?: string
): Promise<Result<EffectivePermission[]>> {
  try {
    if (!resourceId) {
      // Get all permissions for user
      const userPermsQuery = action
        ? `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
           FROM user_permission 
           WHERE user_id = $(userId) AND org_id = $(orgId) AND action = $(action)`
        : `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
           FROM user_permission 
           WHERE user_id = $(userId) AND org_id = $(orgId)`;

      const rolePermsQuery = action
        ? `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
           FROM role_permission rp
           INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
           WHERE ur.user_id = $(userId) AND rp.org_id = $(orgId) AND rp.action = $(action)`
        : `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
           FROM role_permission rp
           INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
           WHERE ur.user_id = $(userId) AND rp.org_id = $(orgId)`;

      const params = action ? { userId, orgId, action } : { userId, orgId };
      
      const [userPerms, rolePerms] = await Promise.all([
        db.manyOrNone(userPermsQuery, params),
        db.manyOrNone(rolePermsQuery, params)
      ]);

      const effectivePerms: EffectivePermission[] = [
        ...userPerms.map((p: any) => ({
          resourceId: p.resource_id,
          action: p.action,
          source: 'user' as const,
          sourceId: p.source_id,
          createdAt: p.created_at
        })),
        ...rolePerms.map((p: any) => ({
          resourceId: p.resource_id,
          action: p.action,
          source: 'role' as const,
          sourceId: p.source_id,
          createdAt: p.created_at
        }))
      ];

      return { success: true, data: effectivePerms };
    }
    
    // Get user's direct permissions - find permissions where the requested resourceId starts with the permission's resource_id
    // This allows /api/users/* to match /api/users/123
    const userPermsQuery = action
      ? `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
         FROM user_permission 
         WHERE user_id = $(userId) AND org_id = $(orgId) 
         AND $(resourceId) LIKE REPLACE(resource_id, '*', '') || '%'
         AND action = $(action)`
      : `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
         FROM user_permission 
         WHERE user_id = $(userId) AND org_id = $(orgId) 
         AND $(resourceId) LIKE REPLACE(resource_id, '*', '') || '%'`;

    const userPermsParams: Record<string, any> = { userId, orgId, resourceId };
    if (action) userPermsParams.action = action;

    // Get permissions from user's roles - find permissions where the requested resourceId starts with the permission's resource_id
    const rolePermsQuery = action
      ? `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
         FROM role_permission rp
         INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
         WHERE ur.user_id = $(userId) AND rp.org_id = $(orgId) 
         AND $(resourceId) LIKE REPLACE(rp.resource_id, '*', '') || '%'
         AND rp.action = $(action)`
      : `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
         FROM role_permission rp
         INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
         WHERE ur.user_id = $(userId) AND rp.org_id = $(orgId) 
         AND $(resourceId) LIKE REPLACE(rp.resource_id, '*', '') || '%'`;

    const rolePermsParams: Record<string, any> = { userId, orgId, resourceId };
    if (action) rolePermsParams.action = action;

    const [userPerms, rolePerms] = await Promise.all([
      db.manyOrNone(userPermsQuery, userPermsParams),
      db.manyOrNone(rolePermsQuery, rolePermsParams)
    ]);

    const effectivePerms: EffectivePermission[] = [
      ...userPerms.map((p: any) => ({
        resourceId: p.resource_id,
        action: p.action,
        source: 'user' as const,
        sourceId: p.source_id,
        createdAt: p.created_at
      })),
      ...rolePerms.map((p: any) => ({
        resourceId: p.resource_id,
        action: p.action,
        source: 'role' as const,
        sourceId: p.source_id,
        createdAt: p.created_at
      }))
    ];

    return { success: true, data: effectivePerms };
  } catch (error) {
    logger.error('Failed to get effective permissions', { error, orgId, userId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

export const getEffectivePermissionsResolver = {
  Query: {
    effectivePermissions: async (_: any, args: { orgId: string; userId: string; resourcePath?: string; action?: string }, context: { db: Database }) => {
      const result = await getEffectivePermissions(context.db, args.orgId, args.userId, args.resourcePath, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};