import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { EffectivePermission } from "../../types.js";

const logger = createLogger("permiso-server:permissions");

export async function getEffectivePermissions(
  ctx: DataContext,
  userId: string,
  resourceId?: string,
  action?: string,
  orgId?: string,
): Promise<Result<EffectivePermission[]>> {
  try {
    const effectiveOrgId = orgId || ctx.orgId;
    const result = await ctx.repos.permission.getEffectivePermissions(
      effectiveOrgId,
      userId,
      resourceId,
      action,
    );
    return result;
  } catch (error) {
    logger.error("Failed to get effective permissions", {
      error,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
