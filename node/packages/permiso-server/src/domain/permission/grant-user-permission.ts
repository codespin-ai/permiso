import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserPermissionWithOrgId } from "../../types.js";

const logger = createLogger("permiso-server:permissions");

export async function grantUserPermission(
  ctx: DataContext,
  userId: string,
  resourceId: string,
  action: string,
): Promise<Result<UserPermissionWithOrgId>> {
  try {
    const result = await ctx.repos.permission.grantUserPermission(
      ctx.orgId,
      userId,
      { resourceId, action },
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    logger.error("Failed to grant user permission", {
      error,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
