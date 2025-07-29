import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:resources');

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

export const deleteResourcesByIdPrefixResolver = {
  Mutation: {
    deleteResourcesByIdPrefix: async (_: any, args: { orgId: string; idPrefix: string; safetyKey?: string }, context: { db: Database; safetyKey?: string }) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error('Invalid safety key');
      }
      
      const result = await deleteResourcesByIdPrefix(context.db, args.orgId, args.idPrefix);
      if (!result.success) {
        throw result.error;
      }
      return {
        success: true,
        deletedCount: result.data
      };
    }
  }
};