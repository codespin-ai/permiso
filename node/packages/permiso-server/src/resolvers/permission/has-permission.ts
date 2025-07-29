import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import { getEffectivePermissions } from './get-effective-permissions.js';

const logger = createLogger('permiso-server:permissions');

export async function hasPermission(
  db: Database,
  orgId: string,
  userId: string,
  resourceId: string,
  action: string
): Promise<Result<boolean>> {
  try {
    const result = await getEffectivePermissions(db, orgId, userId, resourceId, action);
    
    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data.length > 0 };
  } catch (error) {
    logger.error('Failed to check permission', { error, orgId, userId, resourceId, action });
    return { success: false, error: error as Error };
  }
}

export const hasPermissionResolver = {
  Query: {
    hasPermission: async (_: any, args: { orgId: string; userId: string; resourcePath: string; action: string }, context: { db: Database }) => {
      const result = await hasPermission(context.db, args.orgId, args.userId, args.resourcePath, args.action);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};