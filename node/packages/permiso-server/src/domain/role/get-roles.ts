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
    let query = `
      SELECT DISTINCT r.* 
      FROM role r
    `;
    const params: Record<string, any> = { orgId };

    if (filters?.properties && filters.properties.length > 0) {
      query += ` LEFT JOIN role_property rp ON r.id = rp.parent_id AND r.org_id = rp.org_id`;
    }

    const conditions: string[] = [`r.org_id = $(orgId)`];

    if (filters?.ids && filters.ids.length > 0) {
      conditions.push(`r.id = ANY($(ids))`);
      params.ids = filters.ids;
    }

    if (filters?.properties && filters.properties.length > 0) {
      filters.properties.forEach((prop, index) => {
        const nameParam = `propName${index}`;
        const valueParam = `propValue${index}`;
        conditions.push(`(rp.name = $(${nameParam}) AND rp.value = $(${valueParam}))`);
        params[nameParam] = prop.name;
        params[valueParam] = prop.value;
      });
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY r.created_at DESC`;

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