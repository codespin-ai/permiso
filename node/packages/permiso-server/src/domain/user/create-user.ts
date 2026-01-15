import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { User } from "../../repositories/interfaces/index.js";
import type { CreateUserInput } from "../../generated/graphql.js";

const logger = createLogger("permiso-server:users");

export async function createUser(
  ctx: DataContext,
  input: CreateUserInput,
): Promise<Result<User>> {
  try {
    const result = await ctx.repos.user.create(ctx.orgId, {
      id: input.id,
      identityProvider: input.identityProvider,
      identityProviderUserId: input.identityProviderUserId,
      properties: input.properties?.map((p) => ({
        name: p.name,
        value: p.value,
        hidden: p.hidden ?? false,
      })),
      roleIds: input.roleIds ?? undefined,
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data };
  } catch (error) {
    logger.error("Failed to create user", { error, input });
    return { success: false, error: error as Error };
  }
}
