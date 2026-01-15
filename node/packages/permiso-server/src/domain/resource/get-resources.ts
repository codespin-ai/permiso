import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Resource } from "../../repositories/interfaces/index.js";

const logger = createLogger("permiso-server:resources");

export async function getResources(
  ctx: DataContext,
  pagination?: { limit?: number; offset?: number; sortDirection?: "ASC" | "DESC" },
): Promise<Result<Resource[]>> {
  try {
    const result = await ctx.repos.resource.list(
      ctx.orgId,
      undefined,
      pagination ? { first: pagination.limit, offset: pagination.offset, sortDirection: pagination.sortDirection } : undefined,
    );

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.nodes };
  } catch (error) {
    logger.error("Failed to get resources", { error });
    return { success: false, error: error as Error };
  }
}

export async function getResourcesByIdPrefix(
  ctx: DataContext,
  idPrefix: string,
): Promise<Result<Resource[]>> {
  try {
    const result = await ctx.repos.resource.listByIdPrefix(ctx.orgId, idPrefix);
    return result;
  } catch (error) {
    logger.error("Failed to get resources by id prefix", { error, idPrefix });
    return { success: false, error: error as Error };
  }
}
