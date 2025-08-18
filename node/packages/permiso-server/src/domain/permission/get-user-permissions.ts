import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";
import type {
  UserPermissionWithOrgId,
  UserPermissionDbRow,
} from "../../types.js";
import { mapUserPermissionFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:permissions");

export async function getUserPermissions(
  db: Database,
  orgId: string,
  userId?: string,
  resourceId?: string,
  action?: string,
): Promise<Result<UserPermissionWithOrgId[]>> {
  try {
    let query = `SELECT * FROM user_permission WHERE org_id = $(orgId)`;
    const params: Record<string, any> = { orgId };

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

    const rows = await db.manyOrNone<UserPermissionDbRow>(query, params);
    return { success: true, data: rows.map(mapUserPermissionFromDb) };
  } catch (error) {
    logger.error("Failed to get user permissions", {
      error,
      orgId,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
