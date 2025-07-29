import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:users');

export async function deleteUser(
  db: Database,
  orgId: string,
  userId: string
): Promise<Result<boolean>> {
  try {
    await db.none(`DELETE FROM "user" WHERE id = $(userId) AND org_id = $(orgId)`, { userId, orgId });
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete user', { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}

export const deleteUserResolver = {
  Mutation: {
    deleteUser: async (_: any, args: { orgId: string; userId: string; safetyKey?: string }, context: { db: Database; safetyKey?: string }) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error('Invalid safety key');
      }
      
      const result = await deleteUser(context.db, args.orgId, args.userId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};