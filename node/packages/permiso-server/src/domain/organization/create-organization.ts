import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";
import type { Organization, OrganizationDbRow } from "../../types.js";
import type { CreateOrganizationInput } from "../../generated/graphql.js";
import { mapOrganizationFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:organizations");

export async function createOrganization(
  db: Database,
  input: CreateOrganizationInput,
): Promise<Result<Organization>> {
  try {
    const org = await db.tx(async (t) => {
      const orgRow = await t.one<OrganizationDbRow>(
        `INSERT INTO organization (id, name, description) VALUES ($(id), $(name), $(description)) RETURNING *`,
        {
          id: input.id,
          name: input.name,
          description:
            input.description !== undefined ? input.description : null,
        },
      );

      if (input.properties && input.properties.length > 0) {
        const propertyValues = input.properties.map((p) => ({
          parent_id: input.id,
          name: p.name,
          value: p.value === undefined ? null : JSON.stringify(p.value),
          hidden: p.hidden ?? false,
        }));

        for (const prop of propertyValues) {
          await t.none(
            `INSERT INTO organization_property (parent_id, name, value, hidden) VALUES ($(parent_id), $(name), $(value), $(hidden))`,
            {
              parent_id: prop.parent_id,
              name: prop.name,
              value: prop.value,
              hidden: prop.hidden,
            },
          );
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
