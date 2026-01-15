import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserPermissionWithOrgId } from "../../types.js";

const logger = createLogger("permiso-server:permissions");

export async function getUserPermissions(
  ctx: DataContext,
  userId?: string,
  resourceId?: string,
  action?: string,
): Promise<Result<UserPermissionWithOrgId[]>> {
  try {
    // If userId is provided, get permissions for that user
    if (userId) {
      const result = await ctx.repos.permission.getUserPermissions(
        ctx.orgId,
        userId,
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

    // If resourceId is provided without userId, get by resource
    if (resourceId) {
      const result = await ctx.repos.permission.getPermissionsByResource(
        ctx.orgId,
        resourceId,
      );

      if (!result.success) {
        return result;
      }

      let permissions = result.data.userPermissions;
      if (action) {
        permissions = permissions.filter((p) => p.action === action);
      }

      return { success: true, data: permissions };
    }

    // No filters - return empty array (we don't have a list all method)
    return { success: true, data: [] };
  } catch (error) {
    logger.error("Failed to get user permissions", {
      error,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
