import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:permissions");

export async function hasPermission(
  ctx: DataContext,
  userId: string,
  resourceId: string,
  action: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.repos.permission.hasPermission(
      ctx.orgId,
      userId,
      resourceId,
      action,
    );
    return result;
  } catch (error) {
    logger.error("Failed to check permission", {
      error,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
