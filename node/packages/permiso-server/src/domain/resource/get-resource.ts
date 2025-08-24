import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Resource, ResourceDbRow } from "../../types.js";
import { mapResourceFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:resources");

export async function getResource(
  ctx: DataContext,
  resourceId: string,
): Promise<Result<Resource | null>> {
  try {
    const row = await ctx.db.oneOrNone<ResourceDbRow>(
      `SELECT * FROM resource WHERE id = $(resourceId)`,
      { resourceId },
    );

    return {
      success: true,
      data: row ? mapResourceFromDb(row) : null,
    };
  } catch (error) {
    logger.error("Failed to get resource", { error, resourceId });
    return { success: false, error: error as Error };
  }
}
