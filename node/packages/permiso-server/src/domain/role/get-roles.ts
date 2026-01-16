import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { RoleWithProperties, Property } from "../../types.js";

const logger = createLogger("permiso-server:roles");

export async function getRoles(
  ctx: DataContext,
  filters?: {
    ids?: string[];
    properties?: Array<{ name: string; value: unknown }>;
  },
  pagination?: {
    limit?: number;
    offset?: number;
    sortDirection?: "ASC" | "DESC";
  },
  orgId?: string,
): Promise<Result<RoleWithProperties[]>> {
  try {
    // Use explicit orgId if provided, otherwise fall back to ctx.orgId
    const effectiveOrgId = orgId || ctx.orgId;

    // Get roles from repository
    const listResult = await ctx.repos.role.list(
      effectiveOrgId,
      undefined,
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
    if (filters?.ids && filters.ids.length > 0) {
      const idSet = new Set(filters.ids);
      roles = roles.filter((role) => idSet.has(role.id));
    }

    // Build result with properties
    const result = await Promise.all(
      roles.map(async (role) => {
        const propertiesResult = await ctx.repos.role.getProperties(
          effectiveOrgId,
          role.id,
        );

        const properties = propertiesResult.success
          ? propertiesResult.data
          : [];

        // Apply property filters if provided
        if (filters?.properties && filters.properties.length > 0) {
          const propMap = new Map(properties.map((p) => [p.name, p.value]));
          const matches = filters.properties.every((f) => {
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
    logger.error("Failed to get roles", { error, filters });
    return { success: false, error: error as Error };
  }
}
