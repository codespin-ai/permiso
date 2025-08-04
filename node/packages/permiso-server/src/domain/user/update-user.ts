import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  User,
  UserDbRow
} from '../../types.js';
import type {
  UpdateUserInput
} from '../../generated/graphql.js';
import {
  mapUserFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:users');

export async function updateUser(
  db: Database,
  orgId: string,
  userId: string,
  input: UpdateUserInput
): Promise<Result<User>> {
  try {
    const updates: string[] = [];
    const params: Record<string, any> = { userId, orgId };

    if (input.identityProvider !== undefined) {
      updates.push(`identity_provider = $(identityProvider)`);
      params.identityProvider = input.identityProvider;
    }

    if (input.identityProviderUserId !== undefined) {
      updates.push(`identity_provider_user_id = $(identityProviderUserId)`);
      params.identityProviderUserId = input.identityProviderUserId;
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE "user" 
      SET ${updates.join(', ')}
      WHERE id = $(userId) AND org_id = $(orgId)
      RETURNING *
    `;

    const row = await db.one<UserDbRow>(query, params);
    return { success: true, data: mapUserFromDb(row) };
  } catch (error) {
    logger.error('Failed to update user', { error, orgId, userId, input });
    return { success: false, error: error as Error };
  }
}