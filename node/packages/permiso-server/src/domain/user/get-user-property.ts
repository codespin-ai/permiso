import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../context.js";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

export async function getUserProperty(
  ctx: DataContext,
  orgId: string,
  userId: string,
  name: string,
): Promise<Result<Property | null>> {
  try {
    const row = await ctx.db.oneOrNone<PropertyDbRow>(
      `SELECT * FROM user_property WHERE parent_id = $(userId) AND org_id = $(orgId) AND name = $(name)`,
      { userId, orgId, name },
    );

    return {
      success: true,
      data: row ? mapPropertyFromDb(row) : null,
    };
  } catch (error) {
    logger.error("Failed to get user property", { error, orgId, userId, name });
    return { success: false, error: error as Error };
  }
}
