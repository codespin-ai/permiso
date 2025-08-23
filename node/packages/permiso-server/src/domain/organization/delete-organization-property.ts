import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../context.js";

const logger = createLogger("permiso-server:organizations");

export async function deleteOrganizationProperty(
  ctx: DataContext,
  orgId: string,
  name: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.db.result(
      `DELETE FROM organization_property WHERE parent_id = $(orgId) AND name = $(name)`,
      { orgId, name },
    );
    return { success: true, data: result.rowCount > 0 };
  } catch (error) {
    logger.error("Failed to delete organization property", {
      error,
      orgId,
      name,
    });
    return { success: false, error: error as Error };
  }
}
