import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { type Database, sql } from "@codespin/permiso-db";
import type { UserRole, UserRoleDbRow } from "../../types.js";
import { mapUserRoleFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

export async function assignUserRole(
  db: Database,
  orgId: string,
  userId: string,
  roleId: string,
): Promise<Result<UserRole>> {
  try {
    const params = {
      user_id: userId,
      role_id: roleId,
      org_id: orgId,
    };

    const row = await db.one<UserRoleDbRow>(
      `${sql.insert("user_role", params)}
       ON CONFLICT (user_id, role_id, org_id) DO NOTHING
       RETURNING *`,
      params,
    );

    return { success: true, data: mapUserRoleFromDb(row) };
  } catch (error) {
    logger.error("Failed to assign user role", {
      error,
      orgId,
      userId,
      roleId,
    });
    return { success: false, error: error as Error };
  }
}
