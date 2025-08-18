import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

export async function setUserProperty(
  db: Database,
  orgId: string,
  userId: string,
  name: string,
  value: unknown,
  hidden: boolean = false,
): Promise<Result<Property>> {
  try {
    const row = await db.one<PropertyDbRow>(
      `INSERT INTO user_property (parent_id, org_id, name, value, hidden) 
       VALUES ($(userId), $(orgId), $(name), $(value), $(hidden)) 
       ON CONFLICT (parent_id, org_id, name) 
       DO UPDATE SET value = EXCLUDED.value, hidden = EXCLUDED.hidden, created_at = NOW()
       RETURNING *`,
      {
        userId,
        orgId,
        name,
        value: value === undefined ? null : JSON.stringify(value),
        hidden,
      },
    );

    return { success: true, data: mapPropertyFromDb(row) };
  } catch (error) {
    logger.error("Failed to set user property", { error, orgId, userId, name });
    return { success: false, error: error as Error };
  }
}
