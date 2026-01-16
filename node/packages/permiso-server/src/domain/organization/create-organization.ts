import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Organization } from "../../repositories/interfaces/index.js";
import type { CreateOrganizationInput } from "../../generated/graphql.js";

const logger = createLogger("permiso-server:organizations");

export async function createOrganization(
  ctx: DataContext,
  input: CreateOrganizationInput,
): Promise<Result<Organization>> {
  try {
    const result = await ctx.repos.organization.create({
      id: input.id,
      name: input.name,
      description: input.description ?? undefined,
      properties: input.properties?.map((p) => ({
        name: p.name,
        value: p.value,
        hidden: p.hidden ?? false,
      })),
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data };
  } catch (error) {
    logger.error("Failed to create organization", { error, input });
    return { success: false, error: error as Error };
  }
}
