import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property } from "../../types.js";

const logger = createLogger("permiso-server:roles");

export async function getRoleProperties(
  ctx: DataContext,
  roleId: string,
  includeHidden: boolean = true,
): Promise<Result<Property[]>> {
  try {
    const result = await ctx.repos.role.getProperties(ctx.orgId, roleId);

    if (!result.success) {
      return result;
    }

    // Filter out hidden properties if requested
    const properties = includeHidden
      ? result.data
      : result.data.filter((prop) => !prop.hidden);

    return { success: true, data: properties };
  } catch (error) {
    logger.error("Failed to get role properties", { error, roleId });
    return { success: false, error: error as Error };
  }
}
