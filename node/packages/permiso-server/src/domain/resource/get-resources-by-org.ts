import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Resource } from "../../repositories/interfaces/index.js";

const logger = createLogger("permiso-server:resources");

/**
 * ROOT-ONLY function to get resources from a specific organization
 * Used by organization field resolvers that run in unrestricted context
 */
export async function getResourcesByOrg(
  ctx: DataContext,
  orgId: string,
  filter?: { idPrefix?: string },
  pagination?: { limit?: number; offset?: number },
): Promise<Result<Resource[]>> {
  try {
    // If id prefix filter is provided, use the prefix method
    if (filter?.idPrefix) {
      const prefixResult = await ctx.repos.resource.listByIdPrefix(
        orgId,
        filter.idPrefix,
      );
      if (!prefixResult.success) {
        return prefixResult;
      }

      // Apply pagination manually if needed
      let resources = prefixResult.data;
      if (pagination?.offset) {
        resources = resources.slice(pagination.offset);
      }
      if (pagination?.limit) {
        resources = resources.slice(0, pagination.limit);
      }

      return { success: true, data: resources };
    }

    // Otherwise list all resources by org
    const result = await ctx.repos.resource.listByOrg(
      orgId,
      pagination?.limit ? { first: pagination.limit } : undefined,
    );

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data.nodes };
  } catch (error) {
    logger.error("Failed to get resources by org", { error, orgId });
    return { success: false, error: error as Error };
  }
}
