import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { RoleWithProperties, Property } from "../../types.js";

const logger = createLogger("permiso-server:roles");

export async function getRole(
  ctx: DataContext,
  roleId: string,
  orgId?: string,
): Promise<Result<RoleWithProperties | null>> {
  try {
    const effectiveOrgId = orgId || ctx.orgId;
    const roleResult = await ctx.repos.role.getById(effectiveOrgId, roleId);

    if (!roleResult.success) {
      return { success: false, error: roleResult.error };
    }

    if (!roleResult.data) {
      return { success: true, data: null };
    }

    const propertiesResult = await ctx.repos.role.getProperties(
      effectiveOrgId,
      roleId,
    );

    const properties = propertiesResult.success ? propertiesResult.data : [];

    const result: RoleWithProperties = {
      id: roleResult.data.id,
      orgId: roleResult.data.orgId,
      name: roleResult.data.name,
      description: roleResult.data.description,
      createdAt: roleResult.data.createdAt,
      updatedAt: roleResult.data.updatedAt,
      properties: properties.reduce(
        (acc: Record<string, unknown>, prop: Property) => {
          acc[prop.name] = prop.value;
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to get role", { error, roleId });
    return { success: false, error: error as Error };
  }
}
