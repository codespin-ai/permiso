import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '../db.js';
import type {
  Resource,
  ResourceDbRow,
  CreateResourceInput,
  UpdateResourceInput,
  PaginationInput
} from '../types.js';
import {
  mapResourceFromDb,
  mapResourceToDb
} from '../mappers.js';

const logger = createLogger('permiso-rbac:resources');

export async function createResource(
  db: Database,
  input: CreateResourceInput
): Promise<Result<Resource>> {
  try {
    const row = await db.one<ResourceDbRow>(
      `INSERT INTO resource (id, org_id, data) VALUES ($1, $2, $3) RETURNING *`,
      [input.path, input.orgId, input.data ?? null]
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
      `SELECT * FROM resource WHERE id = $1 AND org_id = $2`,
      [resourcePath, orgId]
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
    let query = `SELECT * FROM resource WHERE org_id = $1 ORDER BY created_at DESC`;
    const params: any[] = [orgId];
    let paramCount = 1;

    if (pagination?.limit) {
      query += ` LIMIT $${++paramCount}`;
      params.push(pagination.limit);
    }

    if (pagination?.offset) {
      query += ` OFFSET $${++paramCount}`;
      params.push(pagination.offset);
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
       WHERE org_id = $1 AND id LIKE $2 
       ORDER BY id`,
      [orgId, `${pathPrefix}%`]
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
    const params: any[] = [resourcePath, orgId];
    let paramCount = 2;

    if (input.data !== undefined) {
      updates.push(`data = $${++paramCount}`);
      params.push(input.data);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE resource 
      SET ${updates.join(', ')}
      WHERE id = $1 AND org_id = $2
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
    await db.none(`DELETE FROM resource WHERE id = $1 AND org_id = $2`, [resourcePath, orgId]);
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
      `DELETE FROM resource WHERE org_id = $1 AND id LIKE $2`,
      [orgId, `${pathPrefix}%`]
    );

    return { success: true, data: result.rowCount };
  } catch (error) {
    logger.error('Failed to delete resources by path prefix', { error, orgId, pathPrefix });
    return { success: false, error: error as Error };
  }
}