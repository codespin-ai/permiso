import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:resources");

export async function deleteResourcesByIdPrefix(
  ctx: DataContext,
  idPrefix: string,
): Promise<Result<number>> {
  try {
    const result = await ctx.repos.resource.deleteByIdPrefix(ctx.orgId, idPrefix);
    return result;
  } catch (error) {
    logger.error("Failed to delete resources by id prefix", { error, idPrefix });
    return { success: false, error: error as Error };
  }
}
