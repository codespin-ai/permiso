import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:roles");

export async function deleteRole(
  ctx: DataContext,
  roleId: string,
): Promise<Result<boolean>> {
  try {
    await ctx.db.none(
      `DELETE FROM role WHERE id = $(roleId)`,
      { roleId },
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to delete role", { error, roleId });
    return { success: false, error: error as Error };
  }
}
