import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  User,
  UserDbRow
} from '../../types.js';
import type {
  CreateUserInput
} from '../../generated/graphql.js';
import {
  mapUserFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:users');

export async function createUser(
  db: Database,
  input: CreateUserInput
): Promise<Result<User>> {
  try {
    const user = await db.tx(async (t) => {
      const userRow = await t.one<UserDbRow>(
        `INSERT INTO "user" (id, org_id, identity_provider, identity_provider_user_id) 
         VALUES ($(id), $(orgId), $(identityProvider), $(identityProviderUserId)) RETURNING *`,
        { id: input.id, orgId: input.orgId, identityProvider: input.identityProvider, identityProviderUserId: input.identityProviderUserId }
      );

      if (input.properties && input.properties.length > 0) {
        const propertyValues = input.properties.map(p => ({
          user_id: input.id,
          org_id: input.orgId,
          name: p.name,
          value: p.value,
          hidden: p.hidden ?? false
        }));

        for (const prop of propertyValues) {
          await t.none(
            `INSERT INTO user_property (user_id, org_id, name, value, hidden) VALUES ($(user_id), $(org_id), $(name), $(value), $(hidden))`,
            prop
          );
        }
      }

      if (input.roleIds && input.roleIds.length > 0) {
        for (const roleId of input.roleIds) {
          await t.none(
            `INSERT INTO user_role (user_id, role_id, org_id) VALUES ($(userId), $(roleId), $(orgId))`,
            { userId: input.id, roleId, orgId: input.orgId }
          );
        }
      }

      return userRow;
    });

    return { success: true, data: mapUserFromDb(user) };
  } catch (error) {
    logger.error('Failed to create user', { error, input });
    return { success: false, error: error as Error };
  }
}