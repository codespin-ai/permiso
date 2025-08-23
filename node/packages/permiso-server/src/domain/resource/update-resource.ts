import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../context.js";
import type { Resource, ResourceDbRow } from "../../types.js";
import type { UpdateResourceInput } from "../../generated/graphql.js";
import { mapResourceFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:resources");

export async function updateResource(
  ctx: DataContext,
  orgId: string,
  resourceId: string,
  input: UpdateResourceInput,
): Promise<Result<Resource>> {
  try {
    const updateParams: Record<string, any> = {};

    if (input.name !== undefined) {
      updateParams.name = input.name;
    }

    if (input.description !== undefined) {
      updateParams.description = input.description;
    }

    const whereParams = {
      resource_id: resourceId,
      org_id: orgId,
    };

    const query = `
      ${sql.update("resource", updateParams)}, updated_at = NOW()
      WHERE id = $(resource_id) AND org_id = $(org_id)
      RETURNING *
    `;

    const params = { ...updateParams, ...whereParams };
    const row = await ctx.db.one<ResourceDbRow>(query, params);
    return { success: true, data: mapResourceFromDb(row) };
  } catch (error) {
    logger.error("Failed to update resource", {
      error,
      orgId,
      resourceId,
      input,
    });
    return { success: false, error: error as Error };
  }
}
