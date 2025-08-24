import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type {
  UserPermissionWithOrgId,
  UserPermissionDbRow,
} from "../../types.js";
import { mapUserPermissionFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:permissions");

export async function getUserPermissions(
  ctx: DataContext,
  userId?: string,
  resourceId?: string,
  action?: string,
): Promise<Result<UserPermissionWithOrgId[]>> {
  try {
    let query = `SELECT * FROM user_permission WHERE 1=1`;
    const params: Record<string, any> = {};

    if (userId) {
      query += ` AND user_id = $(userId)`;
      params.userId = userId;
    }

    if (resourceId) {
      query += ` AND resource_id = $(resourceId)`;
      params.resourceId = resourceId;
    }

    if (action) {
      query += ` AND action = $(action)`;
      params.action = action;
    }

    query += ` ORDER BY created_at DESC`;

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
