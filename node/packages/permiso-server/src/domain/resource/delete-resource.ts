import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../context.js";

const logger = createLogger("permiso-server:resources");

export async function deleteResource(
  ctx: DataContext,
  orgId: string,
  resourceId: string,
): Promise<Result<boolean>> {
  try {
    await ctx.db.none(
      `DELETE FROM resource WHERE id = $(resourceId) AND org_id = $(orgId)`,
      { resourceId, orgId },
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to delete resource", { error, orgId, resourceId });
    return { success: false, error: error as Error };
  }
}
