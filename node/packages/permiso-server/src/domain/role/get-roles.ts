import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  RoleDbRow,
  RoleWithProperties
} from '../../types.js';
import type {
  PropertyFilter,
  PaginationInput
} from '../../generated/graphql.js';
import {
  mapRoleFromDb
} from '../../mappers.js';
import { getRoleProperties } from './get-role-properties.js';

const logger = createLogger('permiso-server:roles');

export async function getRoles(
  db: Database,
  orgId: string,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
  },
  pagination?: PaginationInput
): Promise<Result<RoleWithProperties[]>> {
  try {
    let query: string;
    const params: Record<string, any> = { orgId };

    if (filters?.properties && filters.properties.length > 0) {
      // Use a subquery to find roles that have ALL the requested properties
      query = `
        SELECT DISTINCT r.* 
        FROM role r
        WHERE r.org_id = $(orgId)
          AND r.id IN (
            SELECT parent_id 
            FROM role_property
            WHERE org_id = $(orgId)
              AND (name, value) IN (
      `;
      
      const propConditions: string[] = [];
      filters.properties.forEach((prop, index) => {
        propConditions.push(`($(propName${index}), $(propValue${index}))`);
        params[`propName${index}`] = prop.name;
        params[`propValue${index}`] = JSON.stringify(prop.value);
      });
      
      query += propConditions.join(', ');
      query += `)
            GROUP BY parent_id
            HAVING COUNT(DISTINCT name) = $(propCount)
          )`;
      params.propCount = filters.properties.length;
      
      if (filters?.ids && filters.ids.length > 0) {
        query += ` AND r.id = ANY($(ids))`;
        params.ids = filters.ids;
      }
    } else {
      query = `
        SELECT DISTINCT r.* 
        FROM role r
        WHERE r.org_id = $(orgId)
      `;
      
      if (filters?.ids && filters.ids.length > 0) {
        query += ` AND r.id = ANY($(ids))`;
        params.ids = filters.ids;
      }
    }

    query += ` ORDER BY r.id ASC`;

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await db.manyOrNone<RoleDbRow>(query, params);
    const roles = rows.map(mapRoleFromDb);

    const result = await Promise.all(
      roles.map(async (role) => {
        const propertiesResult = await getRoleProperties(db, role.orgId, role.id, false);
        if (!propertiesResult.success) {
          throw propertiesResult.error;
        }
        return {
          ...role,
          properties: propertiesResult.data.reduce((acc, prop) => {
            acc[prop.name] = prop.value;
            return acc;
          }, {} as Record<string, unknown>)
        };
      })
    );

    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get roles', { error, orgId, filters });
    return { success: false, error: error as Error };
  }
}