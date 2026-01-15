import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:users");

export async function unassignUserRole(
  ctx: DataContext,
  userId: string,
  roleId: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.repos.user.unassignRole(ctx.orgId, userId, roleId);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to unassign user role", {
      error,
      userId,
      roleId,
    });
    return { success: false, error: error as Error };
  }
}
