import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../context.js";

const logger = createLogger("permiso-server:permissions");

export async function revokeRolePermission(
  ctx: DataContext,
  orgId: string,
  roleId: string,
  resourceId: string,
  action: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.db.result(
      `DELETE FROM role_permission 
       WHERE role_id = $(roleId) AND org_id = $(orgId) AND resource_id = $(resourceId) AND action = $(action)`,
      { roleId, orgId, resourceId, action },
    );
    return { success: true, data: result.rowCount > 0 };
  } catch (error) {
    logger.error("Failed to revoke role permission", {
      error,
      orgId,
      roleId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
