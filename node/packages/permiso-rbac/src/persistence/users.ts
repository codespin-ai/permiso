import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '../db.js';
import type {
  User,
  UserDbRow,
  UserProperty,
  UserPropertyDbRow,
  UserWithProperties,
  CreateUserInput,
  UpdateUserInput,
  PropertyFilter,
  PaginationInput,
  UserRole,
  UserRoleDbRow
} from '../types.js';
import {
  mapUserFromDb,
  mapUserPropertyFromDb,
  mapUserRoleFromDb
} from '../mappers.js';

const logger = createLogger('permiso-rbac:users');

export async function createUser(
  db: Database,
  input: CreateUserInput
): Promise<Result<User>> {
  try {
    const user = await db.tx(async (t) => {
      const userRow = await t.one<UserDbRow>(
        `INSERT INTO user (id, org_id, identity_provider, identity_provider_user_id, data) 
         VALUES ($(id), $(orgId), $(identityProvider), $(identityProviderUserId), $(data)) RETURNING *`,
        { id: input.id, orgId: input.orgId, identityProvider: input.identityProvider, identityProviderUserId: input.identityProviderUserId, data: input.data ?? null }
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

export async function getUser(
  db: Database,
  orgId: string,
  userId: string
): Promise<Result<UserWithProperties | null>> {
  try {
    const userRow = await db.oneOrNone<UserDbRow>(
      `SELECT * FROM user WHERE id = $(userId) AND org_id = $(orgId)`,
      { userId, orgId }
    );

    if (!userRow) {
      return { success: true, data: null };
    }

    const [properties, roleIds] = await Promise.all([
      getUserProperties(db, orgId, userId, false),
      getUserRoles(db, orgId, userId)
    ]);

    const user = mapUserFromDb(userRow);

    const result: UserWithProperties = {
      ...user,
      roleIds: roleIds.success ? roleIds.data : [],
      properties: properties.reduce((acc: Record<string, string>, prop: UserProperty) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {} as Record<string, string>)
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get user', { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}

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
        const [properties, roleIds] = await Promise.all([
          getUserProperties(db, user.orgId, user.id, false),
          getUserRoles(db, user.orgId, user.id)
        ]);

        return {
          ...user,
          roleIds: roleIds.success ? roleIds.data : [],
          properties: properties.reduce((acc: Record<string, string>, prop: UserProperty) => {
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
        const [properties, roleIds] = await Promise.all([
          getUserProperties(db, user.orgId, user.id, false),
          getUserRoles(db, user.orgId, user.id)
        ]);

        return {
          ...user,
          roleIds: roleIds.success ? roleIds.data : [],
          properties: properties.reduce((acc: Record<string, string>, prop: UserProperty) => {
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

    if (input.data !== undefined) {
      updates.push(`data = $(data)`);
      params.data = input.data;
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

export async function deleteUser(
  db: Database,
  orgId: string,
  userId: string
): Promise<Result<boolean>> {
  try {
    await db.none(`DELETE FROM "user" WHERE id = $(userId) AND org_id = $(orgId)`, { userId, orgId });
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete user', { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}

async function getUserProperties(
  db: Database,
  orgId: string,
  userId: string,
  includeHidden: boolean
): Promise<UserProperty[]> {
  const query = includeHidden
    ? `SELECT * FROM user_property WHERE user_id = $(userId) AND org_id = $(orgId)`
    : `SELECT * FROM user_property WHERE user_id = $(userId) AND org_id = $(orgId) AND hidden = false`;

  const rows = await db.manyOrNone<UserPropertyDbRow>(query, { userId, orgId });
  return rows.map(mapUserPropertyFromDb);
}

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

export async function deleteUserProperty(
  db: Database,
  orgId: string,
  userId: string,
  name: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM user_property WHERE user_id = $(userId) AND org_id = $(orgId) AND name = $(name)`,
      { userId, orgId, name }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete user property', { error, orgId, userId, name });
    return { success: false, error: error as Error };
  }
}

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

export async function unassignUserRole(
  db: Database,
  orgId: string,
  userId: string,
  roleId: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM user_role WHERE user_id = $(userId) AND role_id = $(roleId) AND org_id = $(orgId)`,
      { userId, roleId, orgId }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to unassign user role', { error, orgId, userId, roleId });
    return { success: false, error: error as Error };
  }
}

export async function getUserRoles(
  db: Database,
  orgId: string,
  userId: string
): Promise<Result<string[]>> {
  try {
    const rows = await db.manyOrNone<{ role_id: string }>(
      `SELECT role_id FROM user_role WHERE user_id = $(userId) AND org_id = $(orgId)`,
      { userId, orgId }
    );

    return { success: true, data: rows.map(r => r.role_id) };
  } catch (error) {
    logger.error('Failed to get user roles', { error, orgId, userId });
    return { success: false, error: error as Error };
  }
}