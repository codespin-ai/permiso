import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { ResourceDbRow, Resource } from "../../types.js";
import { mapResourceFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:resources");

/**
 * ROOT-ONLY function to get resources from a specific organization
 * Used by organization field resolvers that run in unrestricted context
 */
export async function getResourcesByOrg(
  ctx: DataContext,
  orgId: string,
  filter?: { idPrefix?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<Result<Resource[]>> {
  try {
    let query = `SELECT * FROM resource WHERE org_id = $(orgId)`;
    const params: Record<string, unknown> = { orgId };

    // Apply id prefix filter if provided
    if (filter?.idPrefix) {
      query += ` AND id LIKE $(idPattern)`;
      params.idPattern = `${filter.idPrefix}%`;
    }

    query += ` ORDER BY id ASC`;

    // Apply pagination
    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }
    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await ctx.db.manyOrNone<ResourceDbRow>(query, params);
    const resources = rows.map(mapResourceFromDb);

    return { success: true, data: resources };
  } catch (error) {
    logger.error("Failed to get resources by org", { error, orgId });
    return { success: false, error: error as Error };
  }
}
