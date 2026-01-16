import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { OrganizationWithProperties } from "../../types.js";

const logger = createLogger("permiso-server:organizations");

export async function getOrganization(
  ctx: DataContext,
  id: string,
): Promise<Result<OrganizationWithProperties | null>> {
  try {
    const orgResult = await ctx.repos.organization.getById(id);
    if (!orgResult.success) {
      return orgResult;
    }

    if (!orgResult.data) {
      return { success: true, data: null };
    }

    const propsResult = await ctx.repos.organization.getProperties(id);
    if (!propsResult.success) {
      return { success: false, error: propsResult.error };
    }

    const result: OrganizationWithProperties = {
      ...orgResult.data,
      properties: propsResult.data.reduce(
        (acc, prop) => {
          acc[prop.name] = prop.value;
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to get organization", { error, id });
    return { success: false, error: error as Error };
  }
}
