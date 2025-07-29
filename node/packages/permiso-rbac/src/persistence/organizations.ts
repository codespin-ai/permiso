import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  Organization,
  OrganizationDbRow,
  OrganizationProperty,
  OrganizationPropertyDbRow,
  OrganizationWithProperties,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  PropertyFilter,
  PaginationInput
} from '../types.js';
import {
  mapOrganizationFromDb,
  mapOrganizationPropertyFromDb
} from '../mappers.js';

const logger = createLogger('permiso-rbac:organizations');

export async function createOrganization(
  db: Database,
  input: CreateOrganizationInput
): Promise<Result<Organization>> {
  try {
    const org = await db.tx(async (t) => {
      const orgRow = await t.one<OrganizationDbRow>(
        `INSERT INTO organization (id, data) VALUES ($(id), $(data)) RETURNING *`,
        { id: input.id, data: input.data ?? null }
      );

      if (input.properties && input.properties.length > 0) {
        const propertyValues = input.properties.map(p => ({
          org_id: input.id,
          name: p.name,
          value: p.value,
          hidden: p.hidden ?? false
        }));

        for (const prop of propertyValues) {
          await t.none(
            `INSERT INTO organization_property (org_id, name, value, hidden) VALUES ($(org_id), $(name), $(value), $(hidden))`,
            { org_id: prop.org_id, name: prop.name, value: prop.value, hidden: prop.hidden }
          );
        }
      }

      return orgRow;
    });

    return { success: true, data: mapOrganizationFromDb(org) };
  } catch (error) {
    logger.error('Failed to create organization', { error, input });
    return { success: false, error: error as Error };
  }
}

export async function getOrganization(
  db: Database,
  id: string
): Promise<Result<OrganizationWithProperties | null>> {
  try {
    const orgRow = await db.oneOrNone<OrganizationDbRow>(
      `SELECT * FROM organization WHERE id = $(id)`,
      { id }
    );

    if (!orgRow) {
      return { success: true, data: null };
    }

    const properties = await getOrganizationProperties(db, id, false);
    const org = mapOrganizationFromDb(orgRow);

    const result: OrganizationWithProperties = {
      ...org,
      properties: properties.reduce((acc, prop) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {} as Record<string, string>)
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get organization', { error, id });
    return { success: false, error: error as Error };
  }
}

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
        const properties = await getOrganizationProperties(db, org.id, false);
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

export async function updateOrganization(
  db: Database,
  id: string,
  input: UpdateOrganizationInput
): Promise<Result<Organization>> {
  try {
    const updates: string[] = [];
    const params: Record<string, any> = { id };

    if (input.data !== undefined) {
      updates.push(`data = $(data)`);
      params.data = input.data;
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE organization 
      SET ${updates.join(', ')}
      WHERE id = $(id)
      RETURNING *
    `;

    const row = await db.one<OrganizationDbRow>(query, params);
    return { success: true, data: mapOrganizationFromDb(row) };
  } catch (error) {
    logger.error('Failed to update organization', { error, id, input });
    return { success: false, error: error as Error };
  }
}

export async function deleteOrganization(
  db: Database,
  id: string
): Promise<Result<boolean>> {
  try {
    await db.none(`DELETE FROM organization WHERE id = $(id)`, { id });
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete organization', { error, id });
    return { success: false, error: error as Error };
  }
}

async function getOrganizationProperties(
  db: Database,
  orgId: string,
  includeHidden: boolean
): Promise<OrganizationProperty[]> {
  const query = includeHidden
    ? `SELECT * FROM organization_property WHERE org_id = $(orgId)`
    : `SELECT * FROM organization_property WHERE org_id = $(orgId) AND hidden = false`;

  const rows = await db.manyOrNone<OrganizationPropertyDbRow>(query, { orgId });
  return rows.map(mapOrganizationPropertyFromDb);
}

export async function setOrganizationProperty(
  db: Database,
  orgId: string,
  name: string,
  value: string,
  hidden: boolean = false
): Promise<Result<OrganizationProperty>> {
  try {
    const row = await db.one<OrganizationPropertyDbRow>(
      `INSERT INTO organization_property (org_id, name, value, hidden) 
       VALUES ($(orgId), $(name), $(value), $(hidden)) 
       ON CONFLICT (org_id, name) 
       DO UPDATE SET value = EXCLUDED.value, hidden = EXCLUDED.hidden, created_at = NOW()
       RETURNING *`,
      { orgId, name, value, hidden }
    );

    return { success: true, data: mapOrganizationPropertyFromDb(row) };
  } catch (error) {
    logger.error('Failed to set organization property', { error, orgId, name });
    return { success: false, error: error as Error };
  }
}

export async function getOrganizationProperty(
  db: Database,
  orgId: string,
  name: string
): Promise<Result<OrganizationProperty | null>> {
  try {
    const row = await db.oneOrNone<OrganizationPropertyDbRow>(
      `SELECT * FROM organization_property WHERE org_id = $(orgId) AND name = $(name)`,
      { orgId, name }
    );

    return {
      success: true,
      data: row ? mapOrganizationPropertyFromDb(row) : null
    };
  } catch (error) {
    logger.error('Failed to get organization property', { error, orgId, name });
    return { success: false, error: error as Error };
  }
}

export async function deleteOrganizationProperty(
  db: Database,
  orgId: string,
  name: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM organization_property WHERE org_id = $(orgId) AND name = $(name)`,
      { orgId, name }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete organization property', { error, orgId, name });
    return { success: false, error: error as Error };
  }
}