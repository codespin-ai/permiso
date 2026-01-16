import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Role } from "../../repositories/interfaces/index.js";
import type { UpdateRoleInput } from "../../generated/graphql.js";

const logger = createLogger("permiso-server:roles");

export async function updateRole(
  ctx: DataContext,
  roleId: string,
  input: UpdateRoleInput,
): Promise<Result<Role>> {
  try {
    const result = await ctx.repos.role.update(ctx.orgId, roleId, {
      name: input.name ?? undefined,
      description: input.description ?? undefined,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: {
        id: result.data.id,
        orgId: result.data.orgId,
        name: result.data.name,
        description: result.data.description,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      },
    };
  } catch (error) {
    logger.error("Failed to update role", { error, roleId, input });
    return { success: false, error: error as Error };
  }
}
