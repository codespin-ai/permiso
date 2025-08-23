import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:roles");

export async function getRoleUsers(
  ctx: DataContext,
  orgId: string,
  roleId: string,
): Promise<Result<string[]>> {
  try {
    const rows = await ctx.db.manyOrNone<{ user_id: string }>(
      `SELECT user_id FROM user_role WHERE role_id = $(roleId) AND org_id = $(orgId)`,
      { roleId, orgId },
    );

    return { success: true, data: rows.map((r) => r.user_id) };
  } catch (error) {
    logger.error("Failed to get role users", { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}
