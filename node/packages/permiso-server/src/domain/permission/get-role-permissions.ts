import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { RolePermissionWithOrgId } from "../../types.js";

const logger = createLogger("permiso-server:permissions");

export async function getRolePermissions(
  ctx: DataContext,
  roleId?: string,
  resourceId?: string,
  action?: string,
): Promise<Result<RolePermissionWithOrgId[]>> {
  try {
    // If roleId is provided, get permissions for that role
    if (roleId) {
      const result = await ctx.repos.permission.getRolePermissions(
        ctx.orgId,
        roleId,
      );

      if (!result.success) {
        return result;
      }

      // Apply additional filters if provided
      let permissions = result.data;
      if (resourceId) {
        permissions = permissions.filter((p) => p.resourceId === resourceId);
      }
      if (action) {
        permissions = permissions.filter((p) => p.action === action);
      }

      return { success: true, data: permissions };
    }

    // If resourceId is provided without roleId, get by resource
    if (resourceId) {
      const result = await ctx.repos.permission.getPermissionsByResource(
        ctx.orgId,
        resourceId,
      );

      if (!result.success) {
        return result;
      }

      let permissions = result.data.rolePermissions;
      if (action) {
        permissions = permissions.filter((p) => p.action === action);
      }

      return { success: true, data: permissions };
    }

    // No filters - return empty array
    return { success: true, data: [] };
  } catch (error) {
    logger.error("Failed to get role permissions", {
      error,
      roleId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
