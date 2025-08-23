import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserDbRow, UserWithProperties, Property } from "../../types.js";
import type {
  PropertyFilter,
  PaginationInput,
} from "../../generated/graphql.js";
import { mapUserFromDb } from "../../mappers.js";
import { getUserProperties } from "./get-user-properties.js";
import { getUserRoles } from "./get-user-roles.js";

const logger = createLogger("permiso-server:users");

export async function getUsers(
  ctx: DataContext,
  orgId: string,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
    identityProvider?: string;
    identityProviderUserId?: string;
  },
  pagination?: PaginationInput,
): Promise<Result<UserWithProperties[]>> {
  try {
    let query: string;
    const params: Record<string, any> = { orgId };

    if (filters?.properties && filters.properties.length > 0) {
      // Use a subquery to find users that have ALL the requested properties
      query = `
        SELECT DISTINCT u.* 
        FROM "user" u
        WHERE u.org_id = $(orgId)
          AND u.id IN (
            SELECT parent_id 
            FROM user_property
            WHERE org_id = $(orgId)
              AND (name, value) IN (
      `;

      const propConditions: string[] = [];
      filters.properties.forEach((prop, index) => {
        propConditions.push(`($(propName${index}), $(propValue${index}))`);
        params[`propName${index}`] = prop.name;
        params[`propValue${index}`] = JSON.stringify(prop.value);
      });

      query += propConditions.join(", ");
      query += `)
            GROUP BY parent_id
            HAVING COUNT(DISTINCT name) = $(propCount)
          )`;
      params.propCount = filters.properties.length;

      if (filters?.ids && filters.ids.length > 0) {
        query += ` AND u.id = ANY($(userIds))`;
        params.userIds = filters.ids;
      }

      if (filters?.identityProvider) {
        query += ` AND u.identity_provider = $(identityProvider)`;
        params.identityProvider = filters.identityProvider;
      }

      if (filters?.identityProviderUserId) {
        query += ` AND u.identity_provider_user_id = $(identityProviderUserId)`;
        params.identityProviderUserId = filters.identityProviderUserId;
      }
    } else {
      query = `
        SELECT DISTINCT u.* 
        FROM "user" u
        WHERE u.org_id = $(orgId)
      `;

      if (filters?.ids && filters.ids.length > 0) {
        query += ` AND u.id = ANY($(userIds))`;
        params.userIds = filters.ids;
      }

      if (filters?.identityProvider) {
        query += ` AND u.identity_provider = $(identityProvider)`;
        params.identityProvider = filters.identityProvider;
      }

      if (filters?.identityProviderUserId) {
        query += ` AND u.identity_provider_user_id = $(identityProviderUserId)`;
        params.identityProviderUserId = filters.identityProviderUserId;
      }
    }

    // Apply sorting - validate and default to ASC if not specified
    const sortDirection = pagination?.sortDirection === "DESC" ? "DESC" : "ASC";
    query += ` ORDER BY u.id ${sortDirection}`;

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await ctx.db.manyOrNone<UserDbRow>(query, params);
    const users = rows.map(mapUserFromDb);

    const result = await Promise.all(
      users.map(async (user) => {
        const [propertiesResult, roleIds] = await Promise.all([
          getUserProperties(ctx, user.orgId, user.id, false),
          getUserRoles(ctx, user.orgId, user.id),
        ]);

        if (!propertiesResult.success) {
          throw propertiesResult.error;
        }

        return {
          ...user,
          roleIds: roleIds.success ? roleIds.data : [],
          properties: propertiesResult.data.reduce(
            (acc: Record<string, unknown>, prop: Property) => {
              acc[prop.name] = prop.value;
              return acc;
            },
            {} as Record<string, unknown>,
          ),
        };
      }),
    );

    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to get users", { error, orgId, filters });
    return { success: false, error: error as Error };
  }
}
