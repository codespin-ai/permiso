import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { UserWithProperties, Property } from "../../types.js";

const logger = createLogger("permiso-server:users");

/**
 * Get users from a specific organization
 * Used by organization field resolvers
 */
export async function getUsersByOrg(
  ctx: DataContext,
  orgId: string,
  filter?: {
    properties?: Array<{ name: string; value: unknown }>;
    ids?: string[];
    identityProvider?: string;
    identityProviderUserId?: string;
  },
  pagination?: { limit?: number; offset?: number; sortDirection?: "ASC" | "DESC" },
): Promise<Result<UserWithProperties[]>> {
  try {
    // Get users with optional identity provider filter
    const listResult = await ctx.repos.user.list(
      orgId,
      filter?.identityProvider ? { identityProvider: filter.identityProvider } : undefined,
      pagination ? { first: pagination.limit, offset: pagination.offset, sortDirection: pagination.sortDirection } : undefined,
    );

    if (!listResult.success) {
      return listResult;
    }

    let users = listResult.data.nodes;

    // Apply ID filter if provided
    if (filter?.ids && filter.ids.length > 0) {
      const idSet = new Set(filter.ids);
      users = users.filter((user) => idSet.has(user.id));
    }

    // Apply identity provider user ID filter if provided
    if (filter?.identityProviderUserId) {
      users = users.filter(
        (user) => user.identityProviderUserId === filter.identityProviderUserId,
      );
    }

    // Build result with properties and role IDs
    const result = await Promise.all(
      users.map(async (user) => {
        const [propertiesResult, roleIdsResult] = await Promise.all([
          ctx.repos.user.getProperties(orgId, user.id),
          ctx.repos.user.getRoleIds(orgId, user.id),
        ]);

        const properties = propertiesResult.success ? propertiesResult.data : [];

        // Apply property filters if provided
        if (filter?.properties && filter.properties.length > 0) {
          const propMap = new Map(properties.map((p) => [p.name, p.value]));
          const matches = filter.properties.every((f) => {
            const propValue = propMap.get(f.name);
            return JSON.stringify(propValue) === JSON.stringify(f.value);
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
    logger.error("Failed to get users by org", { error, orgId });
    return { success: false, error: error as Error };
  }
}
