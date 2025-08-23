import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { EffectivePermission } from "../../types.js";

const logger = createLogger("permiso-server:permissions");

export async function getEffectivePermissionsByPrefix(
  ctx: DataContext,
  orgId: string,
  userId: string,
  resourceIdPrefix: string,
  action?: string,
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

    const userPermsParams: Record<string, any> = {
      userId,
      orgId,
      resourcePattern: `${resourceIdPrefix}%`,
    };
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

    const rolePermsParams: Record<string, any> = {
      userId,
      orgId,
      resourcePattern: `${resourceIdPrefix}%`,
    };
    if (action) rolePermsParams.action = action;

    const [userPerms, rolePerms] = await Promise.all([
      ctx.db.manyOrNone(userPermsQuery, userPermsParams),
      ctx.db.manyOrNone(rolePermsQuery, rolePermsParams),
    ]);

    const effectivePerms: EffectivePermission[] = [
      ...userPerms.map((p: any) => ({
        resourceId: p.resource_id,
        action: p.action,
        source: "user" as const,
        sourceId: p.source_id,
        createdAt: p.created_at,
      })),
      ...rolePerms.map((p: any) => ({
        resourceId: p.resource_id,
        action: p.action,
        source: "role" as const,
        sourceId: p.source_id,
        createdAt: p.created_at,
      })),
    ];

    return { success: true, data: effectivePerms };
  } catch (error) {
    logger.error("Failed to get effective permissions by prefix", {
      error,
      orgId,
      userId,
      resourceIdPrefix,
      action,
    });
    return { success: false, error: error as Error };
  }
}
