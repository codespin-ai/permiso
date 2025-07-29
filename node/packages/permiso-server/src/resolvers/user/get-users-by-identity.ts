import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  UserDbRow,
  UserWithProperties,
  UserProperty
} from '../../types.js';
import {
  mapUserFromDb
} from '../../mappers.js';
import { getUserProperties } from './get-user-properties.js';
import { getUserRoles } from './get-user-roles.js';

const logger = createLogger('permiso-server:users');

export async function getUsersByIdentity(
  db: Database,
  identityProvider: string,
  identityProviderUserId: string
): Promise<Result<UserWithProperties[]>> {
  try {
    const rows = await db.manyOrNone<UserDbRow>(
      `SELECT * FROM "user" WHERE identity_provider = $(identityProvider) AND identity_provider_user_id = $(identityProviderUserId)`,
      { identityProvider, identityProviderUserId }
    );

    const users = rows.map(mapUserFromDb);

    const result = await Promise.all(
      users.map(async (user) => {
        const [propertiesResult, roleIds] = await Promise.all([
          getUserProperties(db, user.orgId, user.id, false),
          getUserRoles(db, user.orgId, user.id)
        ]);

        if (!propertiesResult.success) {
          throw propertiesResult.error;
        }

        return {
          ...user,
          roleIds: roleIds.success ? roleIds.data : [],
          properties: propertiesResult.data.reduce((acc: Record<string, string>, prop: UserProperty) => {
            acc[prop.name] = prop.value;
            return acc;
          }, {} as Record<string, string>)
        };
      })
    );

    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get users by identity', { error, identityProvider, identityProviderUserId });
    return { success: false, error: error as Error };
  }
}

export const getUsersByIdentityResolver = {
  Query: {
    usersByIdentity: async (_: any, args: { identityProvider: string; identityProviderUserId: string }, context: { db: Database }) => {
      const result = await getUsersByIdentity(context.db, args.identityProvider, args.identityProviderUserId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};