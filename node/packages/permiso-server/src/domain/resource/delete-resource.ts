import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:resources");

export async function deleteResource(
  ctx: DataContext,
  resourceId: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.repos.resource.delete(ctx.orgId, resourceId);
    if (!result.success) {
      return { success: false, error: result.error };
    }
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to delete resource", { error, resourceId });
    return { success: false, error: error as Error };
  }
}
