import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";
import type { Resource, ResourceDbRow } from "../../types.js";
import type { CreateResourceInput } from "../../generated/graphql.js";
import { mapResourceFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:resources");

export async function createResource(
  db: Database,
  input: CreateResourceInput,
): Promise<Result<Resource>> {
  try {
    const row = await db.one<ResourceDbRow>(
      `INSERT INTO resource (id, org_id, name, description) VALUES ($(id), $(orgId), $(name), $(description)) RETURNING *`,
      {
        id: input.id,
        orgId: input.orgId,
        name: input.name ?? null,
        description: input.description ?? null,
      },
    );

    return { success: true, data: mapResourceFromDb(row) };
  } catch (error) {
    logger.error("Failed to create resource", { error, input });
    return { success: false, error: error as Error };
  }
}
