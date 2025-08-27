import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { EffectivePermission } from "../../types.js";

const logger = createLogger("permiso-server:permissions");

export async function getEffectivePermissions(
  ctx: DataContext,
  userId: string,
  resourceId?: string,
  action?: string,
): Promise<Result<EffectivePermission[]>> {
  try {
    if (!resourceId) {
      // Get all permissions for user
      const userPermsQuery = action
        ? `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
           FROM user_permission 
           WHERE user_id = $(userId) AND action = $(action)`
        : `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
           FROM user_permission 
           WHERE user_id = $(userId)`;

      const rolePermsQuery = action
        ? `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
           FROM role_permission rp
           INNER JOIN user_role ur ON rp.role_id = ur.role_id
           WHERE ur.user_id = $(userId) AND rp.action = $(action)`
        : `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
           FROM role_permission rp
           INNER JOIN user_role ur ON rp.role_id = ur.role_id
           WHERE ur.user_id = $(userId)`;

      const params = action ? { userId, action } : { userId };

      const [userPerms, rolePerms] = await Promise.all([
        ctx.db.manyOrNone(userPermsQuery, params),
        ctx.db.manyOrNone(rolePermsQuery, params),
      ]);

      const effectivePerms: EffectivePermission[] = [
        ...(
          userPerms as Array<{
            resource_id: string;
            action: string;
            source_id: string;
            created_at: Date;
          }>
        ).map((p) => ({
          resourceId: p.resource_id,
          action: p.action,
          source: "user" as const,
          sourceId: p.source_id,
          createdAt: p.created_at,
        })),
        ...(
          rolePerms as Array<{
            resource_id: string;
            action: string;
            source_id: string;
            created_at: Date;
          }>
        ).map((p) => ({
          resourceId: p.resource_id,
          action: p.action,
          source: "role" as const,
          sourceId: p.source_id,
          createdAt: p.created_at,
        })),
      ];

      return { success: true, data: effectivePerms };
    }

    // Get user's direct permissions - find permissions where the requested resourceId starts with the permission's resource_id
    // This allows /api/users/* to match /api/users/123
    const userPermsQuery = action
      ? `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
         FROM user_permission 
         WHERE user_id = $(userId) 
         AND $(resourceId) LIKE REPLACE(resource_id, '*', '') || '%'
         AND action = $(action)`
      : `SELECT 'user' as source, user_id as source_id, resource_id, action, created_at 
         FROM user_permission 
         WHERE user_id = $(userId) 
         AND $(resourceId) LIKE REPLACE(resource_id, '*', '') || '%'`;

    const userPermsParams: Record<string, unknown> = { userId, resourceId };
    if (action) userPermsParams.action = action;

    // Get permissions from user's roles - find permissions where the requested resourceId starts with the permission's resource_id
    const rolePermsQuery = action
      ? `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
         FROM role_permission rp
         INNER JOIN user_role ur ON rp.role_id = ur.role_id
         WHERE ur.user_id = $(userId) 
         AND $(resourceId) LIKE REPLACE(rp.resource_id, '*', '') || '%'
         AND rp.action = $(action)`
      : `SELECT 'role' as source, rp.role_id as source_id, rp.resource_id, rp.action, rp.created_at 
         FROM role_permission rp
         INNER JOIN user_role ur ON rp.role_id = ur.role_id
         WHERE ur.user_id = $(userId) 
         AND $(resourceId) LIKE REPLACE(rp.resource_id, '*', '') || '%'`;

    const rolePermsParams: Record<string, unknown> = { userId, resourceId };
    if (action) rolePermsParams.action = action;

    const [userPerms, rolePerms] = await Promise.all([
      ctx.db.manyOrNone(userPermsQuery, userPermsParams),
      ctx.db.manyOrNone(rolePermsQuery, rolePermsParams),
    ]);

    const effectivePerms: EffectivePermission[] = [
      ...(
        userPerms as Array<{
          resource_id: string;
          action: string;
          source_id: string;
          created_at: Date;
        }>
      ).map((p) => ({
        resourceId: p.resource_id,
        action: p.action,
        source: "user" as const,
        sourceId: p.source_id,
        createdAt: p.created_at,
      })),
      ...(
        rolePerms as Array<{
          resource_id: string;
          action: string;
          source_id: string;
          created_at: Date;
        }>
      ).map((p) => ({
        resourceId: p.resource_id,
        action: p.action,
        source: "role" as const,
        sourceId: p.source_id,
        createdAt: p.created_at,
      })),
    ];

    return { success: true, data: effectivePerms };
  } catch (error) {
    logger.error("Failed to get effective permissions", {
      error,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
