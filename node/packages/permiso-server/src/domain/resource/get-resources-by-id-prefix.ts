import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Resource } from "../../repositories/interfaces/index.js";

const logger = createLogger("permiso-server:resources");

export async function getResourcesByIdPrefix(
  ctx: DataContext,
  idPrefix: string,
): Promise<Result<Resource[]>> {
  try {
    const result = await ctx.repos.resource.listByIdPrefix(ctx.orgId, idPrefix);
    return result;
  } catch (error) {
    logger.error("Failed to get resources by ID prefix", { error, idPrefix });
    return { success: false, error: error as Error };
  }
}
