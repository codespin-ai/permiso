import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property, OrganizationPropertyDbRow } from "../../types.js";
import { mapOrganizationPropertyFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:organizations");

export async function getOrganizationProperties(
  ctx: DataContext,
  orgId: string,
  includeHidden: boolean = true,
): Promise<Result<Property[]>> {
  try {
    const query = includeHidden
      ? `SELECT * FROM organization_property WHERE parent_id = $(orgId)`
      : `SELECT * FROM organization_property WHERE parent_id = $(orgId) AND hidden = false`;

    const rows = await ctx.db.manyOrNone<OrganizationPropertyDbRow>(query, {
      orgId,
    });
    return { success: true, data: rows.map(mapOrganizationPropertyFromDb) };
  } catch (error) {
    logger.error("Failed to get organization properties", { error, orgId });
    return { success: false, error: error as Error };
  }
}
