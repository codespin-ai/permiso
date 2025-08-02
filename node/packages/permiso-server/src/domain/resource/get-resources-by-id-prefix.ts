import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type { Resource, ResourceDbRow } from '../../types.js';
import { mapResourceFromDb } from '../../mappers.js';

const logger = createLogger('permiso-server:resources');

export async function getResourcesByIdPrefix(
  db: Database,
  orgId: string,
  idPrefix: string
): Promise<Result<Resource[]>> {
  try {
    const rows = await db.manyOrNone<ResourceDbRow>(
      `SELECT * FROM resource WHERE org_id = $(orgId) AND id LIKE $(pattern) ORDER BY id`,
      { orgId, pattern: `${idPrefix}%` }
    );
    
    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error('Failed to get resources by ID prefix', { error, orgId, idPrefix });
    return { success: false, error: error as Error };
  }
}