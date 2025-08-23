import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../context.js";

const logger = createLogger("permiso-server:users");

export async function getUserRoles(
  ctx: DataContext,
  orgId: string,
  userId: string,
): Promise<Result<string[]>> {
  try {
    const rows = await ctx.db.manyOrNone<{ role_id: string }>(
      `SELECT role_id FROM user_role WHERE user_id = $(userId) AND org_id = $(orgId)`,
      { userId, orgId },
    );

    return { success: true, data: rows.map((r) => r.role_id) };
  } catch (error) {
    logger.error("Failed to get user roles", { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}
