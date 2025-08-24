import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type { RoleDbRow, RoleWithProperties } from "../../types.js";
import { mapRoleFromDb } from "../../mappers.js";

const logger = createLogger("permiso-server:roles");

/**
 * ROOT-ONLY function to get roles from a specific organization
 * Used by organization field resolvers that run in unrestricted context
 */
export async function getRolesByOrg(
  ctx: DataContext,
  orgId: string,
  filter?: any,
  pagination?: any,
): Promise<Result<RoleWithProperties[]>> {
  try {
    let query: string;
    const params: any = { orgId };

    if (filter?.properties && filter.properties.length > 0) {
      // Use a subquery to find roles that have ALL the requested properties
      query = `
        SELECT DISTINCT r.* 
        FROM role r
        WHERE r.org_id = $(orgId) AND r.id IN (
            SELECT parent_id 
            FROM role_property
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
        query += ` AND r.id = ANY($(ids))`;
        params.ids = filter.ids;
      }
    } else {
      // Simple query without property filtering
      query = `SELECT * FROM role WHERE org_id = $(orgId)`;

      // Apply filters if provided
      if (filter?.ids?.length > 0) {
        query += ` AND id = ANY($(ids))`;
        params.ids = filter.ids;
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

    const rows = await ctx.db.manyOrNone<RoleDbRow>(query, params);

    // Map to domain objects (simplified - no properties for field resolver)
    const roles: RoleWithProperties[] = rows.map((row) => ({
      ...mapRoleFromDb(row),
      properties: {},
    }));

    return { success: true, data: roles };
  } catch (error) {
    logger.error("Failed to get roles by org", { error, orgId });
    return { success: false, error: error as Error };
  }
}
