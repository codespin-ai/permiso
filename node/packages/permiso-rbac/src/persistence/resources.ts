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

const logger = createLogger('permiso-rbac:resources');

export async function createResource(
  db: Database,
  input: CreateResourceInput
): Promise<Result<Resource>> {
  try {
    const row = await db.one<ResourceDbRow>(
      `INSERT INTO resource (id, org_id, data) VALUES ($(path), $(orgId), $(data)) RETURNING *`,
      { path: input.path, orgId: input.orgId, data: input.data ?? null }
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
  resourcePath: string
): Promise<Result<Resource | null>> {
  try {
    const row = await db.oneOrNone<ResourceDbRow>(
      `SELECT * FROM resource WHERE id = $(resourcePath) AND org_id = $(orgId)`,
      { resourcePath, orgId }
    );

    return {
      success: true,
      data: row ? mapResourceFromDb(row) : null
    };
  } catch (error) {
    logger.error('Failed to get resource', { error, orgId, resourcePath });
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

export async function getResourcesByPathPrefix(
  db: Database,
  orgId: string,
  pathPrefix: string
): Promise<Result<Resource[]>> {
  try {
    const rows = await db.manyOrNone<ResourceDbRow>(
      `SELECT * FROM resource 
       WHERE org_id = $(orgId) AND id LIKE $(pathPattern) 
       ORDER BY id`,
      { orgId, pathPattern: `${pathPrefix}%` }
    );

    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error('Failed to get resources by path prefix', { error, orgId, pathPrefix });
    return { success: false, error: error as Error };
  }
}

export async function updateResource(
  db: Database,
  orgId: string,
  resourcePath: string,
  input: UpdateResourceInput
): Promise<Result<Resource>> {
  try {
    const updates: string[] = [];
    const params: Record<string, any> = { resourcePath, orgId };

    if (input.data !== undefined) {
      updates.push(`data = $(data)`);
      params.data = input.data;
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE resource 
      SET ${updates.join(', ')}
      WHERE id = $(resourcePath) AND org_id = $(orgId)
      RETURNING *
    `;

    const row = await db.one<ResourceDbRow>(query, params);
    return { success: true, data: mapResourceFromDb(row) };
  } catch (error) {
    logger.error('Failed to update resource', { error, orgId, resourcePath, input });
    return { success: false, error: error as Error };
  }
}

export async function deleteResource(
  db: Database,
  orgId: string,
  resourcePath: string
): Promise<Result<boolean>> {
  try {
    await db.none(`DELETE FROM resource WHERE id = $(resourcePath) AND org_id = $(orgId)`, { resourcePath, orgId });
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete resource', { error, orgId, resourcePath });
    return { success: false, error: error as Error };
  }
}

export async function deleteResourcesByPathPrefix(
  db: Database,
  orgId: string,
  pathPrefix: string
): Promise<Result<number>> {
  try {
    const result = await db.result(
      `DELETE FROM resource WHERE org_id = $(orgId) AND id LIKE $(pathPattern)`,
      { orgId, pathPattern: `${pathPrefix}%` }
    );

    return { success: true, data: result.rowCount };
  } catch (error) {
    logger.error('Failed to delete resources by path prefix', { error, orgId, pathPrefix });
    return { success: false, error: error as Error };
  }
}