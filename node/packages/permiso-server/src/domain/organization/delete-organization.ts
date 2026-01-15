import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:organizations");

export async function deleteOrganization(
  ctx: DataContext,
  id: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.repos.organization.delete(id);
    return result;
  } catch (error) {
    logger.error("Failed to delete organization", { error, id });
    return { success: false, error: error as Error };
  }
}
