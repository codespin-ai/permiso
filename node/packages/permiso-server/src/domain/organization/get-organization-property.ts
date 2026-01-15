import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property } from "../../types.js";

const logger = createLogger("permiso-server:organizations");

export async function getOrganizationProperty(
  ctx: DataContext,
  orgId: string,
  name: string,
): Promise<Result<Property | null>> {
  try {
    const result = await ctx.repos.organization.getProperty(orgId, name);
    return result;
  } catch (error) {
    logger.error("Failed to get organization property", { error, orgId, name });
    return { success: false, error: error as Error };
  }
}
