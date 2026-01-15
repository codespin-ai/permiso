import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:users");

export async function getUserRoles(
  ctx: DataContext,
  userId: string,
): Promise<Result<string[]>> {
  try {
    const result = await ctx.repos.user.getRoleIds(ctx.orgId, userId);
    return result;
  } catch (error) {
    logger.error("Failed to get user roles", { error, userId });
    return { success: false, error: error as Error };
  }
}
