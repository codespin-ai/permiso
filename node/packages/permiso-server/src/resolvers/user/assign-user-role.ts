import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  UserRole,
  UserRoleDbRow
} from '../../types.js';
import {
  mapUserRoleFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:users');

export async function assignUserRole(
  db: Database,
  orgId: string,
  userId: string,
  roleId: string
): Promise<Result<UserRole>> {
  try {
    const row = await db.one<UserRoleDbRow>(
      `INSERT INTO user_role (user_id, role_id, org_id) 
       VALUES ($(userId), $(roleId), $(orgId)) 
       ON CONFLICT (user_id, role_id, org_id) DO NOTHING
       RETURNING *`,
      { userId, roleId, orgId }
    );

    return { success: true, data: mapUserRoleFromDb(row) };
  } catch (error) {
    logger.error('Failed to assign user role', { error, orgId, userId, roleId });
    return { success: false, error: error as Error };
  }
}

import { getUser } from './get-user.js';

export const assignUserRoleResolver = {
  Mutation: {
    assignUserRole: async (_: any, args: { orgId: string; userId: string; roleId: string }, context: { db: Database }) => {
      const result = await assignUserRole(context.db, args.orgId, args.userId, args.roleId);
      if (!result.success) {
        throw result.error;
      }
      
      // Return the updated user
      const userResult = await getUser(context.db, args.orgId, args.userId);
      if (!userResult.success) {
        throw userResult.error;
      }
      return userResult.data;
    }
  }
};