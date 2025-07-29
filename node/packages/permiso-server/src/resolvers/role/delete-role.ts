import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:roles');

export async function deleteRole(
  db: Database,
  orgId: string,
  roleId: string
): Promise<Result<boolean>> {
  try {
    await db.none(`DELETE FROM role WHERE id = $(roleId) AND org_id = $(orgId)`, { roleId, orgId });
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete role', { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}

export const deleteRoleResolver = {
  Mutation: {
    deleteRole: async (_: any, args: { orgId: string; roleId: string; safetyKey?: string }, context: { db: Database; safetyKey?: string }) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error('Invalid safety key');
      }
      
      const result = await deleteRole(context.db, args.orgId, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};