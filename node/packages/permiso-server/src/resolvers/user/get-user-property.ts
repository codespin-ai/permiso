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

export async function getUserProperty(
  db: Database,
  orgId: string,
  userId: string,
  name: string
): Promise<Result<UserProperty | null>> {
  try {
    const row = await db.oneOrNone<UserPropertyDbRow>(
      `SELECT * FROM user_property WHERE user_id = $(userId) AND org_id = $(orgId) AND name = $(name)`,
      { userId, orgId, name }
    );

    return {
      success: true,
      data: row ? mapUserPropertyFromDb(row) : null
    };
  } catch (error) {
    logger.error('Failed to get user property', { error, orgId, userId, name });
    return { success: false, error: error as Error };
  }
}

export const getUserPropertyResolver = {
  Query: {
    userProperty: async (_: any, args: { orgId: string; userId: string; propertyName: string }, context: { db: Database }) => {
      const result = await getUserProperty(context.db, args.orgId, args.userId, args.propertyName);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};