import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:organizations');

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