import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type {
  UserPermissionWithOrgId,
  UserPermissionDbRow,
} from "../../types.js";
import { mapUserPermissionFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:permissions");

function buildUserPermissionsQuery(
  userId?: string,
  resourceId?: string,
  action?: string,
): { query: string; params: Record<string, unknown> } {
  const params: Record<string, unknown> = {};
  const conditions: string[] = [];

  if (userId) {
    conditions.push(`user_id = $(userId)`);
    params.userId = userId;
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
  const query = `SELECT * FROM user_permission${whereClause} ORDER BY created_at DESC`;

  return { query, params };
}

export async function getUserPermissions(
  ctx: DataContext,
  userId?: string,
  resourceId?: string,
  action?: string,
): Promise<Result<UserPermissionWithOrgId[]>> {
  try {
    const { query, params } = buildUserPermissionsQuery(
      userId,
      resourceId,
      action,
    );

    const rows = await ctx.db.manyOrNone<UserPermissionDbRow>(query, params);
    return { success: true, data: rows.map(mapUserPermissionFromDb) };
  } catch (error) {
    logger.error("Failed to get user permissions", {
      error,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
