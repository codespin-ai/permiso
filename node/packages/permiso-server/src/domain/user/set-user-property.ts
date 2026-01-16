import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property } from "../../types.js";

const logger = createLogger("permiso-server:users");

export async function setUserProperty(
  ctx: DataContext,
  userId: string,
  name: string,
  value: unknown,
  hidden: boolean = false,
): Promise<Result<Property>> {
  try {
    const result = await ctx.repos.user.setProperty(ctx.orgId, userId, {
      name,
      value,
      hidden,
    });
    return result;
  } catch (error) {
    logger.error("Failed to set user property", { error, userId, name });
    return { success: false, error: error as Error };
  }
}
