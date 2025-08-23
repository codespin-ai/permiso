import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:permissions");

export async function revokeUserPermission(
  ctx: DataContext,
  orgId: string,
  userId: string,
  resourceId: string,
  action: string,
): Promise<Result<boolean>> {
  try {
    await ctx.db.none(
      `DELETE FROM user_permission 
       WHERE user_id = $(userId) AND org_id = $(orgId) AND resource_id = $(resourceId) AND action = $(action)`,
      { userId, orgId, resourceId, action },
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to revoke user permission", {
      error,
      orgId,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
