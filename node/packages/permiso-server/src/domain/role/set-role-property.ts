import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:roles");

export async function setRoleProperty(
  ctx: DataContext,
  roleId: string,
  name: string,
  value: unknown,
  hidden: boolean = false,
): Promise<Result<Property>> {
  try {
    const params = {
      org_id: ctx.orgId,
      parent_id: roleId,
      name,
      value: value === undefined ? null : JSON.stringify(value),
      hidden,
    };

    const row = await ctx.db.one<PropertyDbRow>(
      `${sql.insert("role_property", params)}
       ON CONFLICT (org_id, parent_id, name) 
       DO UPDATE SET value = EXCLUDED.value, hidden = EXCLUDED.hidden, created_at = NOW()
       RETURNING *`,
      params,
    );

    return { success: true, data: mapPropertyFromDb(row) };
  } catch (error) {
    logger.error("Failed to set role property", { error, roleId, name });
    return { success: false, error: error as Error };
  }
}
