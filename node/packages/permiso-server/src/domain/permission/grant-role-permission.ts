import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type {
  RolePermissionWithOrgId,
  RolePermissionDbRow,
} from "../../types.js";
import { mapRolePermissionFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:permissions");

export async function grantRolePermission(
  ctx: DataContext,
  roleId: string,
  resourceId: string,
  action: string,
): Promise<Result<RolePermissionWithOrgId>> {
  try {
    const params = {
      role_id: roleId,
      resource_id: resourceId,
      action: action,
    };

    const row = await ctx.db.one<RolePermissionDbRow>(
      `${sql.insert("role_permission", params)}
       ON CONFLICT (role_id, resource_id, action) DO UPDATE SET created_at = NOW()
       RETURNING *`,
      params,
    );

    return { success: true, data: mapRolePermissionFromDb(row) };
  } catch (error) {
    logger.error("Failed to grant role permission", {
      error,
      roleId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
