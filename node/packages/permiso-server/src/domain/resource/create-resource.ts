import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { Resource } from "../../repositories/interfaces/index.js";
import type { CreateResourceInput } from "../../generated/graphql.js";

const logger = createLogger("permiso-server:resources");

export async function createResource(
  ctx: DataContext,
  input: CreateResourceInput,
): Promise<Result<Resource>> {
  try {
    const result = await ctx.repos.resource.create(ctx.orgId, {
      id: input.id,
      name: input.name ?? undefined,
      description: input.description ?? undefined,
    });

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return {
      success: true,
      data: {
        id: result.data.id,
        orgId: result.data.orgId,
        name: result.data.name,
        description: result.data.description,
        createdAt: result.data.createdAt,
        updatedAt: result.data.updatedAt,
      },
    };
  } catch (error) {
    logger.error("Failed to create resource", { error, input });
    return { success: false, error: error as Error };
  }
}
