import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type {
  UserPermissionWithOrgId,
  UserPermissionDbRow,
} from "../../types.js";
import { mapUserPermissionFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:permissions");

export async function grantUserPermission(
  ctx: DataContext,
  userId: string,
  resourceId: string,
  action: string,
): Promise<Result<UserPermissionWithOrgId>> {
  try {
    const params = {
      org_id: ctx.orgId,
      user_id: userId,
      resource_id: resourceId,
      action: action,
    };

    const row = await ctx.db.one<UserPermissionDbRow>(
      `${sql.insert("user_permission", params)}
       ON CONFLICT (org_id, user_id, resource_id, action) DO UPDATE SET created_at = NOW()
       RETURNING *`,
      params,
    );

    return { success: true, data: mapUserPermissionFromDb(row) };
  } catch (error) {
    logger.error("Failed to grant user permission", {
      error,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
