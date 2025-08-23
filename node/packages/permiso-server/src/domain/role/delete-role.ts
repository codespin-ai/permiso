import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:roles");

export async function deleteRole(
  ctx: DataContext,
  orgId: string,
  roleId: string,
): Promise<Result<boolean>> {
  try {
    await ctx.db.none(
      `DELETE FROM role WHERE id = $(roleId) AND org_id = $(orgId)`,
      { roleId, orgId },
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to delete role", { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}
