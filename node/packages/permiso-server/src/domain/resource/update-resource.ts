import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";
import type { Resource, ResourceDbRow } from "../../types.js";
import type { UpdateResourceInput } from "../../generated/graphql.js";
import { mapResourceFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:resources");

export async function updateResource(
  db: Database,
  orgId: string,
  resourceId: string,
  input: UpdateResourceInput,
): Promise<Result<Resource>> {
  try {
    const updates: string[] = [];
    const params: Record<string, any> = { resourceId, orgId };

    if (input.name !== undefined) {
      updates.push(`name = $(name)`);
      params.name = input.name;
    }

    if (input.description !== undefined) {
      updates.push(`description = $(description)`);
      params.description = input.description;
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE resource 
      SET ${updates.join(", ")}
      WHERE id = $(resourceId) AND org_id = $(orgId)
      RETURNING *
    `;

    const row = await db.one<ResourceDbRow>(query, params);
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
