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
    const result = await ctx.repos.permission.revokeRolePermission(
      ctx.orgId,
      roleId,
      resourceId,
      action,
    );
    return result;
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
