import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property } from "../../types.js";

const logger = createLogger("permiso-server:roles");

export async function setRoleProperty(
  ctx: DataContext,
  roleId: string,
  name: string,
  value: unknown,
  hidden: boolean = false,
): Promise<Result<Property>> {
  try {
    const result = await ctx.repos.role.setProperty(ctx.orgId, roleId, {
      name,
      value,
      hidden,
    });
    return result;
  } catch (error) {
    logger.error("Failed to set role property", { error, roleId, name });
    return { success: false, error: error as Error };
  }
}
