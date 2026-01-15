import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property } from "../../types.js";

const logger = createLogger("permiso-server:roles");

export async function getRoleProperty(
  ctx: DataContext,
  roleId: string,
  name: string,
): Promise<Result<Property | null>> {
  try {
    const result = await ctx.repos.role.getProperty(ctx.orgId, roleId, name);
    return result;
  } catch (error) {
    logger.error("Failed to get role property", { error, roleId, name });
    return { success: false, error: error as Error };
  }
}
