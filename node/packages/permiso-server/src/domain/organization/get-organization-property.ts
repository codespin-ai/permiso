import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property, PropertyDbRow } from "../../types.js";
import { mapPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:organizations");

export async function getOrganizationProperty(
  ctx: DataContext,
  orgId: string,
  name: string,
): Promise<Result<Property | null>> {
  try {
    const row = await ctx.db.oneOrNone<PropertyDbRow>(
      `SELECT * FROM organization_property WHERE parent_id = $(orgId) AND name = $(name)`,
      { orgId, name },
    );

    return {
      success: true,
      data: row ? mapPropertyFromDb(row) : null,
    };
  } catch (error) {
    logger.error("Failed to get organization property", { error, orgId, name });
    return { success: false, error: error as Error };
  }
}
