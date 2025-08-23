import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type { Role, RoleDbRow } from "../../types.js";
import type { CreateRoleInput } from "../../generated/graphql.js";
import { mapRoleFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:roles");

export async function createRole(
  ctx: DataContext,
  input: CreateRoleInput,
): Promise<Result<Role>> {
  try {
    const role = await ctx.db.tx(async (t) => {
      const params = {
        id: input.id,
        org_id: input.orgId,
        name: input.name,
        description: input.description ?? null,
      };

      const roleRow = await t.one<RoleDbRow>(
        `${sql.insert("role", params)} RETURNING *`,
        params,
      );

      if (input.properties && input.properties.length > 0) {
        const propertyValues = input.properties.map((p) => ({
          parent_id: input.id,
          org_id: input.orgId,
          name: p.name,
          value: p.value === undefined ? null : JSON.stringify(p.value),
          hidden: p.hidden ?? false,
        }));

        for (const prop of propertyValues) {
          await t.none(sql.insert("role_property", prop), prop);
        }
      }

      return roleRow;
    });

    return { success: true, data: mapRoleFromDb(role) };
  } catch (error) {
    logger.error("Failed to create role", { error, input });
    return { success: false, error: error as Error };
  }
}
