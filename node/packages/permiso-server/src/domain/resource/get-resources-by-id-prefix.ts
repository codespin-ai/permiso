import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Resource, ResourceDbRow } from "../../types.js";
import { mapResourceFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:resources");

export async function getResourcesByIdPrefix(
  ctx: DataContext,
  idPrefix: string,
): Promise<Result<Resource[]>> {
  try {
    const rows = await ctx.db.manyOrNone<ResourceDbRow>(
      `SELECT * FROM resource WHERE id LIKE $(pattern) ORDER BY id`,
      { pattern: `${idPrefix}%` },
    );

    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error("Failed to get resources by ID prefix", {
      error,
      idPrefix,
    });
    return { success: false, error: error as Error };
  }
}
