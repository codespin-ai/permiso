import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type { Organization, OrganizationDbRow } from "../../types.js";
import type { UpdateOrganizationInput } from "../../generated/graphql.js";
import { mapOrganizationFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:organizations");

export async function updateOrganization(
  ctx: DataContext,
  id: string,
  input: UpdateOrganizationInput,
): Promise<Result<Organization>> {
  try {
    const updateParams: Record<string, any> = {};

    if (input.name !== undefined) {
      updateParams.name = input.name;
    }

    if (input.description !== undefined) {
      updateParams.description = input.description;
    }

    const query = `
      ${sql.update("organization", updateParams)}, updated_at = NOW()
      WHERE id = $(id)
      RETURNING *
    `;

    const params = { ...updateParams, id };
    const row = await ctx.db.one<OrganizationDbRow>(query, params);
    return { success: true, data: mapOrganizationFromDb(row) };
  } catch (error) {
    logger.error("Failed to update organization", { error, id, input });
    return { success: false, error: error as Error };
  }
}
