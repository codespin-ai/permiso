import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  Resource,
  ResourceDbRow,
  CreateResourceInput,
  UpdateResourceInput,
  PaginationInput
} from '../types.js';
import {
  mapResourceFromDb
} from '../mappers.js';

const logger = createLogger('permiso-server:resources');

export async function createResource(
  db: Database,
  input: CreateResourceInput
): Promise<Result<Resource>> {
  try {
    const row = await db.one<ResourceDbRow>(
      `INSERT INTO resource (id, org_id, name, description, data) VALUES ($(id), $(orgId), $(name), $(description), $(data)) RETURNING *`,
      { 
        id: input.id, 
        orgId: input.orgId, 
        name: input.name ?? null,
        description: input.description ?? null,
        data: input.data ?? null 
      }
    );

    return { success: true, data: mapResourceFromDb(row) };
  } catch (error) {
    logger.error('Failed to create resource', { error, input });
    return { success: false, error: error as Error };
  }
}

export async function getResource(
  db: Database,
  orgId: string,
  resourceId: string
): Promise<Result<Resource | null>> {
  try {
    const row = await db.oneOrNone<ResourceDbRow>(
      `SELECT * FROM resource WHERE id = $(resourceId) AND org_id = $(orgId)`,
      { resourceId, orgId }
    );

    return {
      success: true,
      data: row ? mapResourceFromDb(row) : null
    };
  } catch (error) {
    logger.error('Failed to get resource', { error, orgId, resourceId });
    return { success: false, error: error as Error };
  }
}

export async function getResources(
  db: Database,
  orgId: string,
  pagination?: PaginationInput
): Promise<Result<Resource[]>> {
  try {
    let query = `SELECT * FROM resource WHERE org_id = $(orgId) ORDER BY created_at DESC`;
    const params: Record<string, any> = { orgId };

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await db.manyOrNone<ResourceDbRow>(query, params);
    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error('Failed to get resources', { error, orgId });
    return { success: false, error: error as Error };
  }
}

export async function getResourcesByIdPrefix(
  db: Database,
  orgId: string,
  idPrefix: string
): Promise<Result<Resource[]>> {
  try {
    const rows = await db.manyOrNone<ResourceDbRow>(
      `SELECT * FROM resource 
       WHERE org_id = $(orgId) AND id LIKE $(idPattern) 
       ORDER BY id`,
      { orgId, idPattern: `${idPrefix}%` }
    );

    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error('Failed to get resources by id prefix', { error, orgId, idPrefix });
    return { success: false, error: error as Error };
  }
}

export async function updateResource(
  db: Database,
  orgId: string,
  resourceId: string,
  input: UpdateResourceInput
): Promise<Result<Resource>> {
  try {
    const updates: string[] = [];
    const params: Record<string, any> = { resourceId, orgId };

    if (input.name !== undefined) {
      updates.push(`name = $(name)`);
      params.name = input.name;
    }
    
    if (input.description !== undefined) {
      updates.push(`description = $(description)`);
      params.description = input.description;
    }
    
    if (input.data !== undefined) {
      updates.push(`data = $(data)`);
      params.data = input.data;
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE resource 
      SET ${updates.join(', ')}
      WHERE id = $(resourceId) AND org_id = $(orgId)
      RETURNING *
    `;

    const row = await db.one<ResourceDbRow>(query, params);
    return { success: true, data: mapResourceFromDb(row) };
  } catch (error) {
    logger.error('Failed to update resource', { error, orgId, resourceId, input });
    return { success: false, error: error as Error };
  }
}

export async function deleteResource(
  db: Database,
  orgId: string,
  resourceId: string
): Promise<Result<boolean>> {
  try {
    await db.none(`DELETE FROM resource WHERE id = $(resourceId) AND org_id = $(orgId)`, { resourceId, orgId });
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete resource', { error, orgId, resourceId });
    return { success: false, error: error as Error };
  }
}

export async function deleteResourcesByIdPrefix(
  db: Database,
  orgId: string,
  idPrefix: string
): Promise<Result<number>> {
  try {
    const result = await db.result(
      `DELETE FROM resource WHERE org_id = $(orgId) AND id LIKE $(idPattern)`,
      { orgId, idPattern: `${idPrefix}%` }
    );

    return { success: true, data: result.rowCount };
  } catch (error) {
    logger.error('Failed to delete resources by id prefix', { error, orgId, idPrefix });
    return { success: false, error: error as Error };
  }
}