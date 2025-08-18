import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:roles");

export async function setRoleProperty(
  db: Database,
  orgId: string,
  roleId: string,
  name: string,
  value: unknown,
  hidden: boolean = false,
): Promise<Result<Property>> {
  try {
    const row = await db.one<PropertyDbRow>(
      `INSERT INTO role_property (parent_id, org_id, name, value, hidden) 
       VALUES ($(roleId), $(orgId), $(name), $(value), $(hidden)) 
       ON CONFLICT (parent_id, org_id, name) 
       DO UPDATE SET value = $(value), hidden = $(hidden), created_at = NOW()
       RETURNING *`,
      {
        roleId,
        orgId,
        name,
        value: value === undefined ? null : JSON.stringify(value),
        hidden,
      },
    );

    return { success: true, data: mapPropertyFromDb(row) };
  } catch (error) {
    logger.error("Failed to set role property", { error, orgId, roleId, name });
    return { success: false, error: error as Error };
  }
}
