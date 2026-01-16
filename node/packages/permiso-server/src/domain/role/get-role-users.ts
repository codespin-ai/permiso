import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:roles");

export async function getRoleUsers(
  ctx: DataContext,
  roleId: string,
): Promise<Result<string[]>> {
  try {
    const result = await ctx.repos.role.getUserIds(ctx.orgId, roleId);
    return result;
  } catch (error) {
    logger.error("Failed to get role users", { error, roleId });
    return { success: false, error: error as Error };
  }
}
