import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  UserPermission,
  UserPermissionDbRow,
  RolePermission,
  RolePermissionDbRow,
  EffectivePermission
} from '../types.js';
import {
  mapUserPermissionFromDb,
  mapRolePermissionFromDb
} from '../mappers.js';

const logger = createLogger('permiso-rbac:permissions');

// User Permissions
export async function grantUserPermission(
  db: Database,
  orgId: string,
  userId: string,
  resourceId: string,
  action: string
): Promise<Result<UserPermission>> {
  try {
    const row = await db.one<UserPermissionDbRow>(
      `INSERT INTO user_permission (user_id, org_id, resource_id, action) 
       VALUES ($(userId), $(orgId), $(resourceId), $(action)) 
       ON CONFLICT (user_id, org_id, resource_id, action) DO UPDATE SET created_at = NOW()
       RETURNING *`,
      { userId, orgId, resourceId, action }
    );

    return { success: true, data: mapUserPermissionFromDb(row) };
  } catch (error) {
    logger.error('Failed to grant user permission', { error, orgId, userId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

export async function revokeUserPermission(
  db: Database,
  orgId: string,
  userId: string,
  resourceId: string,
  action: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM user_permission 
       WHERE user_id = $(userId) AND org_id = $(orgId) AND resource_id = $(resourceId) AND action = $(action)`,
      { userId, orgId, resourceId, action }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to revoke user permission', { error, orgId, userId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

export async function getUserPermissions(
  db: Database,
  orgId: string,
  userId: string,
  resourceId?: string,
  action?: string
): Promise<Result<UserPermission[]>> {
  try {
    let query = `SELECT * FROM user_permission WHERE user_id = $(userId) AND org_id = $(orgId)`;
    const params: Record<string, any> = { userId, orgId };

    if (resourceId) {
      query += ` AND resource_id = $(resourceId)`;
      params.resourceId = resourceId;
    }

    if (action) {
      query += ` AND action = $(action)`;
      params.action = action;
    }

    query += ` ORDER BY created_at DESC`;

    const rows = await db.manyOrNone<UserPermissionDbRow>(query, params);
    return { success: true, data: rows.map(mapUserPermissionFromDb) };
  } catch (error) {
    logger.error('Failed to get user permissions', { error, orgId, userId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

// Role Permissions
export async function grantRolePermission(
  db: Database,
  orgId: string,
  roleId: string,
  resourceId: string,
  action: string
): Promise<Result<RolePermission>> {
  try {
    const row = await db.one<RolePermissionDbRow>(
      `INSERT INTO role_permission (role_id, org_id, resource_id, action) 
       VALUES ($(roleId), $(orgId), $(resourceId), $(action)) 
       ON CONFLICT (role_id, org_id, resource_id, action) DO UPDATE SET created_at = NOW()
       RETURNING *`,
      { roleId, orgId, resourceId, action }
    );

    return { success: true, data: mapRolePermissionFromDb(row) };
  } catch (error) {
    logger.error('Failed to grant role permission', { error, orgId, roleId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

export async function revokeRolePermission(
  db: Database,
  orgId: string,
  roleId: string,
  resourceId: string,
  action: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM role_permission 
       WHERE role_id = $(roleId) AND org_id = $(orgId) AND resource_id = $(resourceId) AND action = $(action)`,
      { roleId, orgId, resourceId, action }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to revoke role permission', { error, orgId, roleId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

export async function getRolePermissions(
  db: Database,
  orgId: string,
  roleId: string,
  resourceId?: string,
  action?: string
): Promise<Result<RolePermission[]>> {
  try {
    let query = `SELECT * FROM role_permission WHERE role_id = $(roleId) AND org_id = $(orgId)`;
    const params: Record<string, any> = { roleId, orgId };

    if (resourceId) {
      query += ` AND resource_id = $(resourceId)`;
      params.resourceId = resourceId;
    }

    if (action) {
      query += ` AND action = $(action)`;
      params.action = action;
    }

    query += ` ORDER BY created_at DESC`;

    const rows = await db.manyOrNone<RolePermissionDbRow>(query, params);
    return { success: true, data: rows.map(mapRolePermissionFromDb) };
  } catch (error) {
    logger.error('Failed to get role permissions', { error, orgId, roleId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

// Effective Permissions
export async function getEffectivePermissions(
  db: Database,
  orgId: string,
  userId: string,
  resourceId: string,
  action?: string
): Promise<Result<EffectivePermission[]>> {
  try {
    // Get user's direct permissions
    const userPermsQuery = action
      ? `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
         FROM user_permission 
         WHERE user_id = $(userId) AND org_id = $(orgId) AND resource_id = $(resourceId) AND action = $(action)`
      : `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
         FROM user_permission 
         WHERE user_id = $(userId) AND org_id = $(orgId) AND resource_id = $(resourceId)`;

    const userPermsParams: Record<string, any> = { userId, orgId, resourceId };
    if (action) userPermsParams.action = action;

    // Get permissions from user's roles
    const rolePermsQuery = action
      ? `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
         FROM role_permission rp
         INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
         WHERE ur.user_id = $(userId) AND rp.org_id = $(orgId) AND rp.resource_id = $(resourceId) AND rp.action = $(action)`
      : `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
         FROM role_permission rp
         INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
         WHERE ur.user_id = $(userId) AND rp.org_id = $(orgId) AND rp.resource_id = $(resourceId)`;

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

export async function getEffectivePermissionsByPrefix(
  db: Database,
  orgId: string,
  userId: string,
  resourceIdPrefix: string,
  action?: string
): Promise<Result<EffectivePermission[]>> {
  try {
    // Get user's direct permissions
    const userPermsQuery = action
      ? `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
         FROM user_permission 
         WHERE user_id = $(userId) AND org_id = $(orgId) AND resource_id LIKE $(resourcePattern) AND action = $(action)`
      : `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
         FROM user_permission 
         WHERE user_id = $(userId) AND org_id = $(orgId) AND resource_id LIKE $(resourcePattern)`;

    const userPermsParams: Record<string, any> = { userId, orgId, resourcePattern: `${resourceIdPrefix}%` };
    if (action) userPermsParams.action = action;

    // Get permissions from user's roles
    const rolePermsQuery = action
      ? `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
         FROM role_permission rp
         INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
         WHERE ur.user_id = $(userId) AND rp.org_id = $(orgId) AND rp.resource_id LIKE $(resourcePattern) AND rp.action = $(action)`
      : `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
         FROM role_permission rp
         INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
         WHERE ur.user_id = $(userId) AND rp.org_id = $(orgId) AND rp.resource_id LIKE $(resourcePattern)`;

    const rolePermsParams: Record<string, any> = { userId, orgId, resourcePattern: `${resourceIdPrefix}%` };
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
    logger.error('Failed to get effective permissions by prefix', { error, orgId, userId, resourceIdPrefix, action });
    return { success: false, error: error as Error };
  }
}

export async function hasPermission(
  db: Database,
  orgId: string,
  userId: string,
  resourceId: string,
  action: string
): Promise<Result<boolean>> {
  try {
    const result = await getEffectivePermissions(db, orgId, userId, resourceId, action);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data.length > 0 };
  } catch (error) {
    logger.error('Failed to check permission', { error, orgId, userId, resourceId, action });
    return { success: false, error: error as Error };
  }
}