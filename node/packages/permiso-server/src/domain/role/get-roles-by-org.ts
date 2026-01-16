import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { RoleWithProperties, Property } from "../../types.js";

const logger = createLogger("permiso-server:roles");

/**
 * Get roles from a specific organization
 * Used by organization field resolvers
 */
export async function getRolesByOrg(
  ctx: DataContext,
  orgId: string,
  filter?: {
    properties?: Array<{ name: string; value: unknown }>;
    ids?: string[];
  },
  pagination?: {
    limit?: number;
    offset?: number;
    sortDirection?: "ASC" | "DESC";
  },
): Promise<Result<RoleWithProperties[]>> {
  try {
    // Get roles from repository
    const listResult = await ctx.repos.role.listByOrg(
      orgId,
      pagination
        ? {
            first: pagination.limit,
            offset: pagination.offset,
            sortDirection: pagination.sortDirection,
          }
        : undefined,
    );

    if (!listResult.success) {
      return listResult;
    }

    let roles = listResult.data.nodes;

    // Apply ID filter if provided
    if (filter?.ids && filter.ids.length > 0) {
      const idSet = new Set(filter.ids);
      roles = roles.filter((role) => idSet.has(role.id));
    }

    // Build result with properties
    const result = await Promise.all(
      roles.map(async (role) => {
        const propertiesResult = await ctx.repos.role.getProperties(
          orgId,
          role.id,
        );

        const properties = propertiesResult.success
          ? propertiesResult.data
          : [];

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
          id: role.id,
          orgId: role.orgId,
          name: role.name,
          description: role.description,
          createdAt: role.createdAt,
          updatedAt: role.updatedAt,
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

    // Filter out nulls (roles that didn't match property filters)
    const filteredResult = result.filter(
      (role) => role !== null,
    ) as RoleWithProperties[];

    return { success: true, data: filteredResult };
  } catch (error) {
    logger.error("Failed to get roles by org", { error, orgId });
    return { success: false, error: error as Error };
  }
}
