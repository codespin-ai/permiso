import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

export async function getUserProperties(
  db: Database,
  orgId: string,
  userId: string,
  includeHidden: boolean = true,
): Promise<Result<Property[]>> {
  try {
    const query = includeHidden
      ? `SELECT * FROM user_property WHERE parent_id = $(userId) AND org_id = $(orgId)`
      : `SELECT * FROM user_property WHERE parent_id = $(userId) AND org_id = $(orgId) AND hidden = false`;

    const rows = await db.manyOrNone<PropertyDbRow>(query, { userId, orgId });
    return { success: true, data: rows.map(mapPropertyFromDb) };
  } catch (error) {
    logger.error("Failed to get user properties", { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}
