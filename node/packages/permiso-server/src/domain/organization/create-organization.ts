import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../context.js";
import type { Organization, OrganizationDbRow } from "../../types.js";
import type { CreateOrganizationInput } from "../../generated/graphql.js";
import { mapOrganizationFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:organizations");

export async function createOrganization(
  ctx: DataContext,
  input: CreateOrganizationInput,
): Promise<Result<Organization>> {
  try {
    const org = await ctx.db.tx(async (t) => {
      const params = {
        id: input.id,
        name: input.name,
        description: input.description !== undefined ? input.description : null,
      };

      const orgRow = await t.one<OrganizationDbRow>(
        `${sql.insert("organization", params)} RETURNING *`,
        params,
      );

      if (input.properties && input.properties.length > 0) {
        const propertyValues = input.properties.map((p) => ({
          parent_id: input.id,
          name: p.name,
          value: p.value === undefined ? null : JSON.stringify(p.value),
          hidden: p.hidden ?? false,
        }));

        for (const prop of propertyValues) {
          await t.none(sql.insert("organization_property", prop), prop);
        }
      }

      return orgRow;
    });

    return { success: true, data: mapOrganizationFromDb(org) };
  } catch (error) {
    logger.error("Failed to create organization", { error, input });
    return { success: false, error: error as Error };
  }
}
