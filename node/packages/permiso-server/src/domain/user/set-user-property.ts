import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

export async function setUserProperty(
  ctx: DataContext,
  userId: string,
  name: string,
  value: unknown,
  hidden: boolean = false,
): Promise<Result<Property>> {
  try {
    const params = {
      org_id: ctx.orgId,
      parent_id: userId,
      name,
      value: value === undefined ? null : JSON.stringify(value),
      hidden,
      created_at: Date.now(),
    };

    const row = await ctx.db.one<PropertyDbRow>(
      `${sql.insert("user_property", params)}
       ON CONFLICT (org_id, parent_id, name)
       DO UPDATE SET value = EXCLUDED.value, hidden = EXCLUDED.hidden, created_at = EXCLUDED.created_at
       RETURNING *`,
      params,
    );

    return { success: true, data: mapPropertyFromDb(row) };
  } catch (error) {
    logger.error("Failed to set user property", { error, userId, name });
    return { success: false, error: error as Error };
  }
}
