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

export const deleteResourceResolver = {
  Mutation: {
    deleteResource: async (_: any, args: { orgId: string; resourceId: string; safetyKey?: string }, context: { db: Database; safetyKey?: string }) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error('Invalid safety key');
      }
      
      const result = await deleteResource(context.db, args.orgId, args.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};