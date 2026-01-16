import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property } from "../../types.js";

const logger = createLogger("permiso-server:organizations");

export async function getOrganizationProperties(
  ctx: DataContext,
  orgId: string,
  includeHidden: boolean = true,
): Promise<Result<Property[]>> {
  try {
    const result = await ctx.repos.organization.getProperties(orgId);
    if (!result.success) {
      return result;
    }

    // Filter out hidden properties if requested
    const properties = includeHidden
      ? result.data
      : result.data.filter((p) => !p.hidden);

    return { success: true, data: properties };
  } catch (error) {
    logger.error("Failed to get organization properties", { error, orgId });
    return { success: false, error: error as Error };
  }
}
