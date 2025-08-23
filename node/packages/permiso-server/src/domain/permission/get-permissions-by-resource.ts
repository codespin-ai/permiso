import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import { getUserPermissions } from "./get-user-permissions.js";
import { getRolePermissions } from "./get-role-permissions.js";

const logger = createLogger("permiso-server:permissions");

export async function getPermissionsByResource(
  ctx: DataContext,
  orgId: string,
  resourceId: string,
): Promise<Result<Array<any>>> {
  try {
    // Get user permissions for this resource
    const userPermsResult = await getUserPermissions(
      ctx,
      orgId,
      undefined, // no specific user filter
      resourceId,
      undefined, // no specific action filter
    );

    if (!userPermsResult.success) {
      return userPermsResult;
    }

    // Get role permissions for this resource
    const rolePermsResult = await getRolePermissions(
      ctx,
      orgId,
      undefined, // no specific role filter
      resourceId,
      undefined, // no specific action filter
    );

    if (!rolePermsResult.success) {
      return rolePermsResult;
    }

    // Combine both permission types with __typename for GraphQL union resolution
    const permissions = [
      ...userPermsResult.data.map((p) => ({
        __typename: "UserPermission" as const,
        userId: p.userId,
        resourceId: p.resourceId,
        action: p.action,
        createdAt: p.createdAt,
        orgId: p.orgId,
      })),
      ...rolePermsResult.data.map((p) => ({
        __typename: "RolePermission" as const,
        roleId: p.roleId,
        resourceId: p.resourceId,
        action: p.action,
        createdAt: p.createdAt,
        orgId: p.orgId,
      })),
    ];

    return { success: true, data: permissions };
  } catch (error) {
    logger.error("Failed to get permissions by resource", {
      error,
      orgId,
      resourceId,
    });
    return { success: false, error: error as Error };
  }
}
