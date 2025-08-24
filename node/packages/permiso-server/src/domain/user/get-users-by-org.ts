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
    let query: string;
    const params: any = { orgId };

    if (filter?.properties && filter.properties.length > 0) {
      // Use a subquery to find users that have ALL the requested properties
      query = `
        SELECT DISTINCT u.* 
        FROM "user" u
        WHERE u.org_id = $(orgId) AND u.id IN (
            SELECT parent_id 
            FROM user_property
            WHERE (name, value) IN (
      `;

      const propConditions: string[] = [];
      filter.properties.forEach((prop: any, index: number) => {
        propConditions.push(`($(propName${index}), $(propValue${index}))`);
        params[`propName${index}`] = prop.name;
        params[`propValue${index}`] = JSON.stringify(prop.value);
      });

      query += propConditions.join(", ");
      query += `)
            GROUP BY parent_id
            HAVING COUNT(DISTINCT name) = $(propCount)
          )`;
      params.propCount = filter.properties.length;

      if (filter?.ids?.length > 0) {
        query += ` AND u.id = ANY($(ids))`;
        params.ids = filter.ids;
      }

      if (filter?.identityProvider) {
        query += ` AND u.identity_provider = $(identityProvider)`;
        params.identityProvider = filter.identityProvider;
      }

      if (filter?.identityProviderUserId) {
        query += ` AND u.identity_provider_user_id = $(identityProviderUserId)`;
        params.identityProviderUserId = filter.identityProviderUserId;
      }
    } else {
      // Simple query without property filtering
      query = `SELECT * FROM "user" WHERE org_id = $(orgId)`;

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

    // Map to domain objects and fetch role IDs for each user
    const users: UserWithProperties[] = await Promise.all(
      rows.map(async (row) => {
        const user = mapUserFromDb(row);

        // Fetch role IDs for this user
        const roleIds = await ctx.db.manyOrNone<{ role_id: string }>(
          `SELECT role_id FROM user_role WHERE user_id = $(userId) AND org_id = $(orgId)`,
          { userId: user.id, orgId },
        );

        return {
          ...user,
          roleIds: roleIds.map((r) => r.role_id),
          properties: {}, // Properties will be loaded by field resolver if needed
        };
      }),
    );

    return { success: true, data: users };
  } catch (error) {
    logger.error("Failed to get users by org", { error, orgId });
    return { success: false, error: error as Error };
  }
}
