import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  OrganizationDbRow,
  OrganizationWithProperties
} from '../../types.js';
import type {
  PropertyFilter,
  PaginationInput
} from '../../generated/graphql.js';
import {
  mapOrganizationFromDb
} from '../../mappers.js';
import { getOrganizationProperties } from './get-organization-properties.js';

const logger = createLogger('permiso-server:organizations');

export async function getOrganizations(
  db: Database,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
  },
  pagination?: PaginationInput
): Promise<Result<OrganizationWithProperties[]>> {
  try {
    let query = `
      SELECT DISTINCT o.* 
      FROM organization o
    `;
    const params: Record<string, any> = {};

    if (filters?.properties && filters.properties.length > 0) {
      query += ` LEFT JOIN organization_property op ON o.id = op.org_id`;
    }

    const conditions: string[] = [];

    if (filters?.ids && filters.ids.length > 0) {
      conditions.push(`o.id = ANY($(ids))`);
      params.ids = filters.ids;
    }

    if (filters?.properties && filters.properties.length > 0) {
      filters.properties.forEach((prop, index) => {
        conditions.push(`(op.name = $(propName${index}) AND op.value = $(propValue${index}))`);
        params[`propName${index}`] = prop.name;
        params[`propValue${index}`] = prop.value;
      });
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += ` ORDER BY o.created_at DESC`;

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await db.manyOrNone<OrganizationDbRow>(query, params);
    const orgs = rows.map(mapOrganizationFromDb);

    const result = await Promise.all(
      orgs.map(async (org) => {
        const propsResult = await getOrganizationProperties(db, org.id, false);
        if (!propsResult.success) {
          throw propsResult.error;
        }
        const properties = propsResult.data;
        return {
          ...org,
          properties: properties.reduce((acc, prop) => {
            acc[prop.name] = prop.value;
            return acc;
          }, {} as Record<string, string>)
        };
      })
    );

    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get organizations', { error, filters });
    return { success: false, error: error as Error };
  }
}