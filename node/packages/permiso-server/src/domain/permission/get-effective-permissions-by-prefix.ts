import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { EffectivePermission } from "../../types.js";

const logger = createLogger("permiso-server:permissions");

export async function getEffectivePermissionsByPrefix(
  ctx: DataContext,
  userId: string,
  resourceIdPrefix: string,
  action?: string,
): Promise<Result<EffectivePermission[]>> {
  try {
    const result = await ctx.repos.permission.getEffectivePermissionsByPrefix(
      ctx.orgId,
      userId,
      resourceIdPrefix,
    );

    if (!result.success) {
      return result;
    }

    // Apply action filter if provided
    let permissions = result.data;
    if (action) {
      permissions = permissions.filter((p) => p.action === action);
    }

    return { success: true, data: permissions };
  } catch (error) {
    logger.error("Failed to get effective permissions by prefix", {
      error,
      userId,
      resourceIdPrefix,
      action,
    });
    return { success: false, error: error as Error };
  }
}
