import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:permissions");

export async function revokeRolePermission(
  ctx: DataContext,
  roleId: string,
  resourceId: string,
  action: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.db.result(
      `DELETE FROM role_permission 
       WHERE role_id = $(roleId) AND resource_id = $(resourceId) AND action = $(action)`,
      { roleId, resourceId, action },
    );
    return { success: true, data: result.rowCount > 0 };
  } catch (error) {
    logger.error("Failed to revoke role permission", {
      error,
      roleId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
