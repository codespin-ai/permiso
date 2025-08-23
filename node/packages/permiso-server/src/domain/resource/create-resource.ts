import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { type Database, sql } from "@codespin/permiso-db";
import type { Resource, ResourceDbRow } from "../../types.js";
import type { CreateResourceInput } from "../../generated/graphql.js";
import { mapResourceFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:resources");

export async function createResource(
  db: Database,
  input: CreateResourceInput,
): Promise<Result<Resource>> {
  try {
    const params = {
      id: input.id,
      org_id: input.orgId,
      name: input.name ?? null,
      description: input.description ?? null,
    };

    const row = await db.one<ResourceDbRow>(
      `${sql.insert("resource", params)} RETURNING *`,
      params,
    );

    return { success: true, data: mapResourceFromDb(row) };
  } catch (error) {
    logger.error("Failed to create resource", { error, input });
    return { success: false, error: error as Error };
  }
}
