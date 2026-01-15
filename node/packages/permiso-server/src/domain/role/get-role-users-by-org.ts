import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:roles");

/**
 * Get user IDs for a role, using explicit orgId (not context.orgId)
 * Used by field resolvers that may run in ROOT context
 */
export async function getRoleUsersByOrg(
  ctx: DataContext,
  orgId: string,
  roleId: string,
): Promise<Result<string[]>> {
  try {
    const result = await ctx.repos.role.getUserIds(orgId, roleId);
    return result;
  } catch (error) {
    logger.error("Failed to get role users", { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}
