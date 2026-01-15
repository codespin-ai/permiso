import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Property } from "../../types.js";

const logger = createLogger("permiso-server:organizations");

export async function setOrganizationProperty(
  ctx: DataContext,
  orgId: string,
  name: string,
  value: unknown,
  hidden: boolean = false,
): Promise<Result<Property>> {
  try {
    const result = await ctx.repos.organization.setProperty(orgId, {
      name,
      value,
      hidden,
    });
    return result;
  } catch (error) {
    logger.error("Failed to set organization property", { error, orgId, name });
    return { success: false, error: error as Error };
  }
}
