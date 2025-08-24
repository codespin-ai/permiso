import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserDbRow, UserWithProperties } from "../../types.js";
import { mapUserFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:users");

/**
 * ROOT-ONLY function to get users from a specific organization
 * Used by organization field resolvers that run in unrestricted context
 */
export async function getUsersByOrg(
  ctx: DataContext,
  orgId: string,
  filter?: any,
  pagination?: any,
): Promise<Result<UserWithProperties[]>> {
  try {
    let query = `SELECT * FROM "user" WHERE org_id = $(orgId)`;
    const params: any = { orgId };

    // Apply filters if provided
    if (filter?.ids?.length > 0) {
      query += ` AND id = ANY($(ids))`;
      params.ids = filter.ids;
    }

    if (filter?.identityProvider) {
      query += ` AND identity_provider = $(identityProvider)`;
      params.identityProvider = filter.identityProvider;
    }

    if (filter?.identityProviderUserId) {
      query += ` AND identity_provider_user_id = $(identityProviderUserId)`;
      params.identityProviderUserId = filter.identityProviderUserId;
    }

    query += ` ORDER BY created_at DESC`;

    // Apply pagination
    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }
    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;  
      params.offset = pagination.offset;
    }

    const rows = await ctx.db.manyOrNone<UserDbRow>(query, params);

    // Map to domain objects (simplified - no properties/roles for field resolver)
    const users: UserWithProperties[] = rows.map((row) => ({
      ...mapUserFromDb(row),
      roleIds: [],
      properties: {},
    }));

    return { success: true, data: users };
  } catch (error) {
    logger.error("Failed to get users by org", { error, orgId });
    return { success: false, error: error as Error };
  }
}