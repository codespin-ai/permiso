import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  UserDbRow,
  UserWithProperties,
  UserProperty
} from '../../types.js';
import type {
  PropertyFilter,
  PaginationInput
} from '../../generated/graphql.js';
import {
  mapUserFromDb
} from '../../mappers.js';
import { getUserProperties } from './get-user-properties.js';
import { getUserRoles } from './get-user-roles.js';

const logger = createLogger('permiso-server:users');

export async function getUsers(
  db: Database,
  orgId: string,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
    identityProvider?: string;
    identityProviderUserId?: string;
  },
  pagination?: PaginationInput
): Promise<Result<UserWithProperties[]>> {
  try {
    let query = `
      SELECT DISTINCT u.* 
      FROM "user" u
    `;
    const params: Record<string, any> = { orgId };

    if (filters?.properties && filters.properties.length > 0) {
      query += ` LEFT JOIN user_property up ON u.id = up.user_id AND u.org_id = up.org_id`;
    }

    const conditions: string[] = [`u.org_id = $(orgId)`];

    if (filters?.ids && filters.ids.length > 0) {
      conditions.push(`u.id = ANY($(userIds))`);
      params.userIds = filters.ids;
    }

    if (filters?.identityProvider) {
      conditions.push(`u.identity_provider = $(identityProvider)`);
      params.identityProvider = filters.identityProvider;
    }

    if (filters?.identityProviderUserId) {
      conditions.push(`u.identity_provider_user_id = $(identityProviderUserId)`);
      params.identityProviderUserId = filters.identityProviderUserId;
    }

    if (filters?.properties && filters.properties.length > 0) {
      filters.properties.forEach((prop, index) => {
        conditions.push(`(up.name = $(propName${index}) AND up.value = $(propValue${index}))`);
        params[`propName${index}`] = prop.name;
        params[`propValue${index}`] = prop.value;
      });
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY u.created_at DESC`;

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await db.manyOrNone<UserDbRow>(query, params);
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
    logger.error('Failed to get users', { error, orgId, filters });
    return { success: false, error: error as Error };
  }
}