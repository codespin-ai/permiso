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
  orgId: string,
  userId: string,
  input: UpdateUserInput,
): Promise<Result<User>> {
  try {
    const updateParams: Record<string, any> = {};

    if (input.identityProvider !== undefined) {
      updateParams.identityProvider = input.identityProvider;
    }

    if (input.identityProviderUserId !== undefined) {
      updateParams.identityProviderUserId = input.identityProviderUserId;
    }

    const snakeParams = typeUtils.toSnakeCase(updateParams);
    const whereParams = {
      user_id: userId,
      org_id: orgId,
    };

    const query = `
      ${sql.update('"user"', snakeParams)}, updated_at = NOW()
      WHERE id = $(user_id) AND org_id = $(org_id)
      RETURNING *
    `;

    const params = { ...snakeParams, ...whereParams };
    const row = await ctx.db.one<UserDbRow>(query, params);
    return { success: true, data: mapUserFromDb(row) };
  } catch (error) {
    logger.error("Failed to update user", { error, orgId, userId, input });
    return { success: false, error: error as Error };
  }
}
