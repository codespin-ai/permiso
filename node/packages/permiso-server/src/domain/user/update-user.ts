import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { User } from "../../repositories/interfaces/index.js";
import type { UpdateUserInput } from "../../generated/graphql.js";

const logger = createLogger("permiso-server:users");

export async function updateUser(
  ctx: DataContext,
  userId: string,
  input: UpdateUserInput,
): Promise<Result<User>> {
  try {
    const result = await ctx.repos.user.update(ctx.orgId, userId, {
      identityProvider: input.identityProvider ?? undefined,
      identityProviderUserId: input.identityProviderUserId ?? undefined,
    });

    if (!result.success) {
      return result;
    }

    return { success: true, data: result.data };
  } catch (error) {
    logger.error("Failed to update user", { error, userId, input });
    return { success: false, error: error as Error };
  }
}
