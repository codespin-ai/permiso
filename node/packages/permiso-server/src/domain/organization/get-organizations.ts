import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
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

function buildOrganizationQuery(
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
  },
  pagination?: PaginationInput,
): { query: string; params: Record<string, any> } {
  const params: Record<string, any> = {};

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
      SELECT DISTINCT o.* 
      FROM organization o
      WHERE o.id IN (
        SELECT parent_id 
        FROM organization_property
        WHERE (name, value) IN (${propConditions.join(", ")})
        GROUP BY parent_id
        HAVING COUNT(DISTINCT name) = $(propCount)
      )`;
  };

  const baseQuery =
    buildPropertiesQuery() ||
    `
    SELECT DISTINCT o.* 
    FROM organization o`;

  const idCondition =
    filters?.ids && filters.ids.length > 0
      ? ((params.ids = filters.ids), `o.id = ANY($(ids))`)
      : null;

  const query = [
    baseQuery,
    buildPropertiesQuery() && idCondition
      ? ` AND ${idCondition}`
      : !buildPropertiesQuery() && idCondition
        ? ` WHERE ${idCondition}`
        : "",
    ` ORDER BY o.id ${pagination?.sortDirection === "DESC" ? "DESC" : "ASC"}`,
    pagination?.limit ? ` LIMIT $(limit)` : "",
    pagination?.offset ? ` OFFSET $(offset)` : "",
  ].join("");

  if (pagination?.limit) params.limit = pagination.limit;
  if (pagination?.offset) params.offset = pagination.offset;

  return { query, params };
}

export async function getOrganizations(
  ctx: DataContext,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
  },
  pagination?: PaginationInput,
): Promise<Result<OrganizationWithProperties[]>> {
  try {
    // Use ROOT access for listing organizations
    const rootDb = ctx.db.upgradeToRoot?.("List organizations") || ctx.db;

    const { query, params } = buildOrganizationQuery(filters, pagination);

    const rows = await rootDb.manyOrNone<OrganizationDbRow>(query, params);
    const orgs = rows.map(mapOrganizationFromDb);

    // Use rootDb context for getting properties
    const rootCtx = { ...ctx, db: rootDb };
    const result = await Promise.all(
      orgs.map(async (org) => {
        const propsResult = await getOrganizationProperties(
          rootCtx,
          org.id,
          false,
        );
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
