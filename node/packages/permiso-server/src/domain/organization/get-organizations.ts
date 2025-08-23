import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../context.js";
import type {
  OrganizationDbRow,
  OrganizationWithProperties,
} from "../../types.js";
import type {
  PropertyFilter,
  PaginationInput,
} from "../../generated/graphql.js";
import { mapOrganizationFromDb } from "../../mappers.js";
import { getOrganizationProperties } from "./get-organization-properties.js";

const logger = createLogger("permiso-server:organizations");

export async function getOrganizations(
  ctx: DataContext,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
  },
  pagination?: PaginationInput,
): Promise<Result<OrganizationWithProperties[]>> {
  try {
    let query: string;
    const params: Record<string, any> = {};

    if (filters?.properties && filters.properties.length > 0) {
      // Use a subquery to find organizations that have ALL the requested properties
      query = `
        SELECT DISTINCT o.* 
        FROM organization o
        WHERE o.id IN (
          SELECT parent_id 
          FROM organization_property
          WHERE (name, value) IN (
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
        query += ` AND o.id = ANY($(ids))`;
        params.ids = filters.ids;
      }
    } else {
      query = `
        SELECT DISTINCT o.* 
        FROM organization o
      `;

      if (filters?.ids && filters.ids.length > 0) {
        query += ` WHERE o.id = ANY($(ids))`;
        params.ids = filters.ids;
      }
    }

    // Apply sorting - validate and default to ASC if not specified
    const sortDirection = pagination?.sortDirection === "DESC" ? "DESC" : "ASC";
    query += ` ORDER BY o.id ${sortDirection}`;

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await ctx.db.manyOrNone<OrganizationDbRow>(query, params);
    const orgs = rows.map(mapOrganizationFromDb);

    const result = await Promise.all(
      orgs.map(async (org) => {
        const propsResult = await getOrganizationProperties(ctx, org.id, false);
        if (!propsResult.success) {
          throw propsResult.error;
        }
        const properties = propsResult.data;
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

    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to get organizations", { error, filters });
    return { success: false, error: error as Error };
  }
}
