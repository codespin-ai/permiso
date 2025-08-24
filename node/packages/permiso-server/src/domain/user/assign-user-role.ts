import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type { UserRole, UserRoleDbRow } from "../../types.js";
import { mapUserRoleFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

export async function assignUserRole(
  ctx: DataContext,
  userId: string,
  roleId: string,
): Promise<Result<UserRole>> {
  try {
    const params = {
      user_id: userId,
      role_id: roleId,
    };

    const row = await ctx.db.one<UserRoleDbRow>(
      `${sql.insert("user_role", params)}
       ON CONFLICT (user_id, role_id) DO NOTHING
       RETURNING *`,
      params,
    );

    return { success: true, data: mapUserRoleFromDb(row) };
  } catch (error) {
    logger.error("Failed to assign user role", {
      error,
      userId,
      roleId,
    });
    return { success: false, error: error as Error };
  }
}
