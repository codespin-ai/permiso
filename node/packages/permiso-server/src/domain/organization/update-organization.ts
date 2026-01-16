import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Organization } from "../../repositories/interfaces/index.js";
import type { UpdateOrganizationInput } from "../../generated/graphql.js";

const logger = createLogger("permiso-server:organizations");

export async function updateOrganization(
  ctx: DataContext,
  id: string,
  input: UpdateOrganizationInput,
): Promise<Result<Organization>> {
  try {
    const result = await ctx.repos.organization.update(id, {
      name: input.name ?? undefined,
      description: input.description ?? undefined,
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data };
  } catch (error) {
    logger.error("Failed to update organization", { error, id, input });
    return { success: false, error: error as Error };
  }
}
