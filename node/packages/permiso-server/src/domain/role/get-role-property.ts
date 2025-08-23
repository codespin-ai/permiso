import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../context.js";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:roles");

export async function getRoleProperty(
  ctx: DataContext,
  orgId: string,
  roleId: string,
  name: string,
): Promise<Result<Property | null>> {
  try {
    const row = await ctx.db.oneOrNone<PropertyDbRow>(
      `SELECT * FROM role_property WHERE parent_id = $(roleId) AND org_id = $(orgId) AND name = $(name)`,
      { roleId, orgId, name },
    );

    return {
      success: true,
      data: row ? mapPropertyFromDb(row) : null,
    };
  } catch (error) {
    logger.error("Failed to get role property", { error, orgId, roleId, name });
    return { success: false, error: error as Error };
  }
}
