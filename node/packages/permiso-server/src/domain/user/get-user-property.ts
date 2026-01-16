import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property } from "../../types.js";

const logger = createLogger("permiso-server:users");

export async function getUserProperty(
  ctx: DataContext,
  userId: string,
  name: string,
): Promise<Result<Property | null>> {
  try {
    const result = await ctx.repos.user.getProperty(ctx.orgId, userId, name);
    return result;
  } catch (error) {
    logger.error("Failed to get user property", { error, userId, name });
    return { success: false, error: error as Error };
  }
}
