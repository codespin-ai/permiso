import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type { Role, RoleDbRow } from "../../types.js";
import type { UpdateRoleInput } from "../../generated/graphql.js";
import { mapRoleFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:roles");

export async function updateRole(
  ctx: DataContext,
  roleId: string,
  input: UpdateRoleInput,
): Promise<Result<Role>> {
  try {
    const updateParams: Record<string, any> = {};

    if (input.name !== undefined) {
      updateParams.name = input.name;
    }

    if (input.description !== undefined) {
      updateParams.description = input.description;
    }

    const whereParams = {
      role_id: roleId,
    };

    const query = `
      ${sql.update("role", updateParams)}, updated_at = NOW()
      WHERE id = $(role_id)
      RETURNING *
    `;

    const params = { ...updateParams, ...whereParams };
    const row = await ctx.db.one<RoleDbRow>(query, params);
    return { success: true, data: mapRoleFromDb(row) };
  } catch (error) {
    logger.error("Failed to update role", { error, roleId, input });
    return { success: false, error: error as Error };
  }
}
