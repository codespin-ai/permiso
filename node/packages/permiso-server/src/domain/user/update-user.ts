import { createLogger } from "@codespin/permiso-logger";
import { Result, typeUtils } from "@codespin/permiso-core";
import { sql } from "@codespin/permiso-db";
import type { DataContext } from "../data-context.js";
import type { User, UserDbRow } from "../../types.js";
import type { UpdateUserInput } from "../../generated/graphql.js";
import { mapUserFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

export async function updateUser(
  ctx: DataContext,
  userId: string,
  input: UpdateUserInput,
): Promise<Result<User>> {
  try {
    const updateParams: Record<string, unknown> = {};

    if (input.identityProvider !== undefined) {
      updateParams.identityProvider = input.identityProvider;
    }

    if (input.identityProviderUserId !== undefined) {
      updateParams.identityProviderUserId = input.identityProviderUserId;
    }

    const snakeParams = typeUtils.toSnakeCase(updateParams);
    snakeParams.updated_at = Date.now();
    const whereParams = {
      user_id: userId,
    };

    const query = `
      ${sql.update('"user"', snakeParams)}
      WHERE id = $(user_id)
      RETURNING *
    `;

    const params = { ...snakeParams, ...whereParams };
    const row = await ctx.db.one<UserDbRow>(query, params);
    return { success: true, data: mapUserFromDb(row) };
  } catch (error) {
    logger.error("Failed to update user", { error, userId, input });
    return { success: false, error: error as Error };
  }
}
