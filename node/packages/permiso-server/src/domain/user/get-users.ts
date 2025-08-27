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

function buildUserQuery(
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
    identityProvider?: string;
    identityProviderUserId?: string;
  },
  pagination?: PaginationInput,
): { query: string; params: Record<string, unknown> } {
  const params: Record<string, unknown> = {};

  const buildPropertiesQuery = () => {
    if (!filters?.properties || filters.properties.length === 0) return null;

    const propConditions: string[] = [];
    filters.properties.forEach((prop, index) => {
      propConditions.push(`($(propName${index}), $(propValue${index}))`);
      params[`propName${index}`] = prop.name;
      params[`propValue${index}`] = JSON.stringify(prop.value);
    });

    params.propCount = filters.properties.length;

    return `
      SELECT DISTINCT u.* 
      FROM "user" u
      WHERE u.id IN (
          SELECT parent_id 
          FROM user_property
          WHERE (name, value) IN (${propConditions.join(", ")})
          GROUP BY parent_id
          HAVING COUNT(DISTINCT name) = $(propCount)
        )`;
  };

  const buildBasicQuery = () => `
    SELECT DISTINCT u.* 
    FROM "user" u`;

  const buildWhereConditions = () => {
    const conditions: string[] = [];

    if (filters?.ids && filters.ids.length > 0) {
      conditions.push(`u.id = ANY($(userIds))`);
      params.userIds = filters.ids;
    }

    if (filters?.identityProvider) {
      conditions.push(`u.identity_provider = $(identityProvider)`);
      params.identityProvider = filters.identityProvider;
    }

    if (filters?.identityProviderUserId) {
      conditions.push(
        `u.identity_provider_user_id = $(identityProviderUserId)`,
      );
      params.identityProviderUserId = filters.identityProviderUserId;
    }

    return conditions;
  };

  const propertiesQuery = buildPropertiesQuery();
  const baseQuery = propertiesQuery || buildBasicQuery();
  const whereConditions = buildWhereConditions();

  const query = [
    baseQuery,
    propertiesQuery && whereConditions.length > 0
      ? ` AND ${whereConditions.join(" AND ")}`
      : !propertiesQuery && whereConditions.length > 0
        ? ` WHERE ${whereConditions.join(" AND ")}`
        : "",
    ` ORDER BY u.id ${pagination?.sortDirection === "DESC" ? "DESC" : "ASC"}`,
    pagination?.limit ? ` LIMIT $(limit)` : "",
    pagination?.offset ? ` OFFSET $(offset)` : "",
  ].join("");

  if (pagination?.limit) params.limit = pagination.limit;
  if (pagination?.offset) params.offset = pagination.offset;

  return { query, params };
}

export async function getUsers(
  ctx: DataContext,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
    identityProvider?: string;
    identityProviderUserId?: string;
  },
  pagination?: PaginationInput,
): Promise<Result<UserWithProperties[]>> {
  try {
    const { query, params } = buildUserQuery(filters, pagination);

    const rows = await ctx.db.manyOrNone<UserDbRow>(query, params);
    const users = rows.map(mapUserFromDb);

    const result = await Promise.all(
      users.map(async (user) => {
        const [propertiesResult, roleIds] = await Promise.all([
          getUserProperties(ctx, user.id, false),
          getUserRoles(ctx, user.id),
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
    logger.error("Failed to get users", { error, filters });
    return { success: false, error: error as Error };
  }
}
