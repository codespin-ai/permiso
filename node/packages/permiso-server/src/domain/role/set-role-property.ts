import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { type Database, sql } from "@codespin/permiso-db";
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
    const params = {
      parent_id: roleId,
      org_id: orgId,
      name,
      value: value === undefined ? null : JSON.stringify(value),
      hidden,
    };

    const row = await db.one<PropertyDbRow>(
      `${sql.insert("role_property", params)}
       ON CONFLICT (parent_id, org_id, name) 
       DO UPDATE SET value = EXCLUDED.value, hidden = EXCLUDED.hidden, created_at = NOW()
       RETURNING *`,
      params,
    );

    return { success: true, data: mapPropertyFromDb(row) };
  } catch (error) {
    logger.error("Failed to set role property", { error, orgId, roleId, name });
    return { success: false, error: error as Error };
  }
}
