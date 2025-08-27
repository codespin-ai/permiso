import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type {
  RolePermissionWithOrgId,
  RolePermissionDbRow,
} from "../../types.js";
import { mapRolePermissionFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:permissions");

function buildRolePermissionsQuery(
  roleId?: string,
  resourceId?: string,
  action?: string,
): { query: string; params: Record<string, unknown> } {
  const params: Record<string, unknown> = {};
  const conditions: string[] = [];

  if (roleId) {
    conditions.push(`role_id = $(roleId)`);
    params.roleId = roleId;
  }

  if (resourceId) {
    conditions.push(`resource_id = $(resourceId)`);
    params.resourceId = resourceId;
  }

  if (action) {
    conditions.push(`action = $(action)`);
    params.action = action;
  }

  const whereClause =
    conditions.length > 0 ? ` WHERE ${conditions.join(" AND ")}` : "";
  const query = `SELECT * FROM role_permission${whereClause} ORDER BY created_at DESC`;

  return { query, params };
}

export async function getRolePermissions(
  ctx: DataContext,
  roleId?: string,
  resourceId?: string,
  action?: string,
): Promise<Result<RolePermissionWithOrgId[]>> {
  try {
    const { query, params } = buildRolePermissionsQuery(
      roleId,
      resourceId,
      action,
    );

    const rows = await ctx.db.manyOrNone<RolePermissionDbRow>(query, params);
    return { success: true, data: rows.map(mapRolePermissionFromDb) };
  } catch (error) {
    logger.error("Failed to get role permissions", {
      error,
      roleId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
