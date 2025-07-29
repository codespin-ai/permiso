import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  UserProperty,
  UserPropertyDbRow
} from '../../types.js';
import {
  mapUserPropertyFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:users');

export async function setUserProperty(
  db: Database,
  orgId: string,
  userId: string,
  name: string,
  value: string,
  hidden: boolean = false
): Promise<Result<UserProperty>> {
  try {
    const row = await db.one<UserPropertyDbRow>(
      `INSERT INTO user_property (user_id, org_id, name, value, hidden) 
       VALUES ($(userId), $(orgId), $(name), $(value), $(hidden)) 
       ON CONFLICT (user_id, org_id, name) 
       DO UPDATE SET value = EXCLUDED.value, hidden = EXCLUDED.hidden, created_at = NOW()
       RETURNING *`,
      { userId, orgId, name, value, hidden }
    );

    return { success: true, data: mapUserPropertyFromDb(row) };
  } catch (error) {
    logger.error('Failed to set user property', { error, orgId, userId, name });
    return { success: false, error: error as Error };
  }
}

export const setUserPropertyResolver = {
  Mutation: {
    setUserProperty: async (_: any, args: { orgId: string; userId: string; name: string; value: string; hidden?: boolean }, context: { db: Database }) => {
      const result = await setUserProperty(context.db, args.orgId, args.userId, args.name, args.value, args.hidden ?? false);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};