import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:resources');

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