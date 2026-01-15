import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserWithProperties, Property } from "../../types.js";
import type {
  PropertyFilter,
  PaginationInput,
} from "../../generated/graphql.js";

const logger = createLogger("permiso-server:users");

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
    // Get users with optional identity provider filter
    const listResult = await ctx.repos.user.list(
      ctx.orgId,
      filters?.identityProvider ? { identityProvider: filters.identityProvider } : undefined,
      pagination ? { first: pagination.limit ?? undefined, offset: pagination.offset ?? undefined, sortDirection: pagination.sortDirection ?? undefined } : undefined,
    );

    if (!listResult.success) {
      return listResult;
    }

    let users = listResult.data.nodes;

    // Apply ID filter if provided
    if (filters?.ids && filters.ids.length > 0) {
      const idSet = new Set(filters.ids);
      users = users.filter((user) => idSet.has(user.id));
    }

    // Apply identity provider user ID filter if provided
    if (filters?.identityProviderUserId) {
      users = users.filter(
        (user) => user.identityProviderUserId === filters.identityProviderUserId,
      );
    }

    // Build result with properties
    const result = await Promise.all(
      users.map(async (user) => {
        const [propertiesResult, roleIdsResult] = await Promise.all([
          ctx.repos.user.getProperties(ctx.orgId, user.id),
          ctx.repos.user.getRoleIds(ctx.orgId, user.id),
        ]);

        const properties = propertiesResult.success ? propertiesResult.data : [];

        // Apply property filters if provided
        if (filters?.properties && filters.properties.length > 0) {
          const propMap = new Map(properties.map((p) => [p.name, p.value]));
          const matches = filters.properties.every((filter) => {
            const propValue = propMap.get(filter.name);
            return JSON.stringify(propValue) === JSON.stringify(filter.value);
          });
          if (!matches) {
            return null;
          }
        }

        return {
          ...user,
          roleIds: roleIdsResult.success ? roleIdsResult.data : [],
          properties: properties.reduce(
            (acc: Record<string, unknown>, prop: Property) => {
              acc[prop.name] = prop.value;
              return acc;
            },
            {} as Record<string, unknown>,
          ),
        };
      }),
    );

    // Filter out nulls (users that didn't match property filters)
    const filteredResult = result.filter(
      (user): user is UserWithProperties => user !== null,
    );

    return { success: true, data: filteredResult };
  } catch (error) {
    logger.error("Failed to get users", { error, filters });
    return { success: false, error: error as Error };
  }
}
