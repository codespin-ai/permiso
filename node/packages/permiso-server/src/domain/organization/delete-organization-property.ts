import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:organizations");

export async function deleteOrganizationProperty(
  ctx: DataContext,
  orgId: string,
  name: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.repos.organization.deleteProperty(orgId, name);
    return result;
  } catch (error) {
    logger.error("Failed to delete organization property", {
      error,
      orgId,
      name,
    });
    return { success: false, error: error as Error };
  }
}
