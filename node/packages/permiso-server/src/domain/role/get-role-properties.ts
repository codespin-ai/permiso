import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:roles");

export async function getRoleProperties(
  ctx: DataContext,
  roleId: string,
  includeHidden: boolean = true,
): Promise<Result<Property[]>> {
  try {
    const query = includeHidden
      ? `SELECT * FROM role_property WHERE parent_id = $(roleId)`
      : `SELECT * FROM role_property WHERE parent_id = $(roleId) AND hidden = false`;

    const rows = await ctx.db.manyOrNone<PropertyDbRow>(query, {
      roleId,
    });
    return { success: true, data: rows.map(mapPropertyFromDb) };
  } catch (error) {
    logger.error("Failed to get role properties", { error, roleId });
    return { success: false, error: error as Error };
  }
}
