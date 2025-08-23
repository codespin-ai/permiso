import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../context.js";
import type {
  UserPermissionWithOrgId,
  UserPermissionDbRow,
} from "../../types.js";
import { mapUserPermissionFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:permissions");

export async function grantUserPermission(
  ctx: DataContext,
  orgId: string,
  userId: string,
  resourceId: string,
  action: string,
): Promise<Result<UserPermissionWithOrgId>> {
  try {
    const params = {
      user_id: userId,
      org_id: orgId,
      resource_id: resourceId,
      action: action,
    };

    const row = await ctx.db.one<UserPermissionDbRow>(
      `${sql.insert("user_permission", params)}
       ON CONFLICT (user_id, org_id, resource_id, action) DO UPDATE SET created_at = NOW()
       RETURNING *`,
      params,
    );

    return { success: true, data: mapUserPermissionFromDb(row) };
  } catch (error) {
    logger.error("Failed to grant user permission", {
      error,
      orgId,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
