import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  UserDbRow,
  UserWithProperties,
  Property
} from '../../types.js';
import {
  mapUserFromDb
} from '../../mappers.js';
import { getUserProperties } from './get-user-properties.js';
import { getUserRoles } from './get-user-roles.js';

const logger = createLogger('permiso-server:users');

export async function getUser(
  db: Database,
  orgId: string,
  userId: string
): Promise<Result<UserWithProperties | null>> {
  try {
    const userRow = await db.oneOrNone<UserDbRow>(
      `SELECT * FROM "user" WHERE id = $(userId) AND org_id = $(orgId)`,
      { userId, orgId }
    );

    if (!userRow) {
      return { success: true, data: null };
    }

    const [propertiesResult, roleIds] = await Promise.all([
      getUserProperties(db, orgId, userId, false),
      getUserRoles(db, orgId, userId)
    ]);

    if (!propertiesResult.success) {
      throw propertiesResult.error;
    }

    const user = mapUserFromDb(userRow);

    const result: UserWithProperties = {
      ...user,
      roleIds: roleIds.success ? roleIds.data : [],
      properties: propertiesResult.data.reduce((acc: Record<string, unknown>, prop: Property) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {} as Record<string, unknown>)
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get user', { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}