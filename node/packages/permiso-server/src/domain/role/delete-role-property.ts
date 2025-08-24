import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:roles");

export async function deleteRoleProperty(
  ctx: DataContext,
  roleId: string,
  name: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.db.result(
      `DELETE FROM role_property WHERE parent_id = $(roleId) AND name = $(name)`,
      { roleId, name },
    );
    return { success: true, data: result.rowCount > 0 };
  } catch (error) {
    logger.error("Failed to delete role property", {
      error,
      roleId,
      name,
    });
    return { success: false, error: error as Error };
  }
}
