import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Resource, ResourceDbRow } from "../../types.js";
import type { PaginationInput } from "../../generated/graphql.js";
import { mapResourceFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:resources");

export async function getResources(
  ctx: DataContext,
  pagination?: PaginationInput,
): Promise<Result<Resource[]>> {
  try {
    // Apply sorting - validate and default to ASC if not specified
    const sortDirection = pagination?.sortDirection === "DESC" ? "DESC" : "ASC";
    let query = `SELECT * FROM resource ORDER BY id ${sortDirection}`;
    const params: Record<string, any> = {};

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await ctx.db.manyOrNone<ResourceDbRow>(query, params);
    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error("Failed to get resources", { error });
    return { success: false, error: error as Error };
  }
}

export async function getResourcesByIdPrefix(
  ctx: DataContext,
  idPrefix: string,
): Promise<Result<Resource[]>> {
  try {
    const rows = await ctx.db.manyOrNone<ResourceDbRow>(
      `SELECT * FROM resource 
       WHERE id LIKE $(idPattern) 
       ORDER BY id`,
      { idPattern: `${idPrefix}%` },
    );

    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error("Failed to get resources by id prefix", {
      error,
      idPrefix,
    });
    return { success: false, error: error as Error };
  }
}
