import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:roles");

export async function deleteRoleProperty(
  ctx: DataContext,
  orgId: string,
  roleId: string,
  name: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.db.result(
      `DELETE FROM role_property WHERE parent_id = $(roleId) AND org_id = $(orgId) AND name = $(name)`,
      { roleId, orgId, name },
    );
    return { success: true, data: result.rowCount > 0 };
  } catch (error) {
    logger.error("Failed to delete role property", {
      error,
      orgId,
      roleId,
      name,
    });
    return { success: false, error: error as Error };
  }
}
