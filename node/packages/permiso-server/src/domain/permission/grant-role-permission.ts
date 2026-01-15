import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { RolePermissionWithOrgId } from "../../types.js";

const logger = createLogger("permiso-server:permissions");

export async function grantRolePermission(
  ctx: DataContext,
  roleId: string,
  resourceId: string,
  action: string,
): Promise<Result<RolePermissionWithOrgId>> {
  try {
    const result = await ctx.repos.permission.grantRolePermission(
      ctx.orgId,
      roleId,
      { resourceId, action },
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data };
  } catch (error) {
    logger.error("Failed to grant role permission", {
      error,
      roleId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
