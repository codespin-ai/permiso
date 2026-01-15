import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { OrganizationWithProperties } from "../../types.js";
import type { PropertyFilter } from "../../generated/graphql.js";

const logger = createLogger("permiso-server:organizations");

export async function getOrganizations(
  ctx: DataContext,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
  },
  pagination?: { limit?: number; offset?: number },
): Promise<Result<OrganizationWithProperties[]>> {
  try {
    // Get organizations with optional name filter
    const listResult = await ctx.repos.organization.list(
      undefined, // no name filter in current interface
      pagination ? { first: pagination.limit } : undefined,
    );

    if (!listResult.success) {
      return listResult;
    }

    let orgs = listResult.data.nodes;

    // Apply ID filter if provided
    if (filters?.ids && filters.ids.length > 0) {
      const idSet = new Set(filters.ids);
      orgs = orgs.filter((org) => idSet.has(org.id));
    }

    // Build result with properties
    const result = await Promise.all(
      orgs.map(async (org) => {
        const propsResult = await ctx.repos.organization.getProperties(org.id);
        const properties = propsResult.success ? propsResult.data : [];

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
          ...org,
          properties: properties.reduce(
            (acc, prop) => {
              acc[prop.name] = prop.value;
              return acc;
            },
            {} as Record<string, unknown>,
          ),
        };
      }),
    );

    // Filter out nulls (orgs that didn't match property filters)
    const filteredResult = result.filter(
      (org) => org !== null,
    ) as OrganizationWithProperties[];

    return { success: true, data: filteredResult };
  } catch (error) {
    logger.error("Failed to get organizations", { error, filters });
    return { success: false, error: error as Error };
  }
}
