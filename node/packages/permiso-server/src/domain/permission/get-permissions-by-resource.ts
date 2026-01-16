import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:permissions");

export async function getPermissionsByResource(
  ctx: DataContext,
  resourceId: string,
): Promise<
  Result<
    Array<{
      __typename: "UserPermission" | "RolePermission";
      userId?: string;
      roleId?: string;
      resourceId: string;
      action: string;
      createdAt: number;
      orgId: string;
    }>
  >
> {
  try {
    const result = await ctx.repos.permission.getPermissionsByResource(
      ctx.orgId,
      resourceId,
    );

    if (!result.success) {
      return result;
    }

    // Combine both permission types with __typename for GraphQL union resolution
    const permissions = [
      ...result.data.userPermissions.map((p) => ({
        __typename: "UserPermission" as const,
        userId: p.userId,
        resourceId: p.resourceId,
        action: p.action,
        createdAt: p.createdAt,
        orgId: p.orgId,
      })),
      ...result.data.rolePermissions.map((p) => ({
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
      resourceId,
    });
    return { success: false, error: error as Error };
  }
}
