import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:resources");

export async function deleteResource(
  ctx: DataContext,
  resourceId: string,
): Promise<Result<boolean>> {
  try {
    await ctx.db.none(
      `DELETE FROM resource WHERE id = $(resourceId)`,
      { resourceId },
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to delete resource", { error, resourceId });
    return { success: false, error: error as Error };
  }
}
