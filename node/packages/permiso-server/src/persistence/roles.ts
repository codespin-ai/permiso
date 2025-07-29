import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  Role,
  RoleDbRow,
  RoleProperty,
  RolePropertyDbRow,
  RoleWithProperties,
  CreateRoleInput,
  UpdateRoleInput,
  PropertyFilter,
  PaginationInput
} from '../types.js';
import {
  mapRoleFromDb,
  mapRolePropertyFromDb
} from '../mappers.js';

const logger = createLogger('permiso-server:roles');

export async function createRole(
  db: Database,
  input: CreateRoleInput
): Promise<Result<Role>> {
  try {
    const role = await db.tx(async (t) => {
      const roleRow = await t.one<RoleDbRow>(
        `INSERT INTO role (id, org_id, name, description, data) VALUES ($(id), $(orgId), $(name), $(description), $(data)) RETURNING *`,
        { 
          id: input.id, 
          orgId: input.orgId, 
          name: input.name,
          description: input.description ?? null,
          data: input.data ?? null 
        }
      );

      if (input.properties && input.properties.length > 0) {
        const propertyValues = input.properties.map(p => ({
          role_id: input.id,
          org_id: input.orgId,
          name: p.name,
          value: p.value,
          hidden: p.hidden ?? false
        }));

        for (const prop of propertyValues) {
          await t.none(
            `INSERT INTO role_property (role_id, org_id, name, value, hidden) VALUES ($(roleId), $(orgId), $(name), $(value), $(hidden))`,
            { roleId: prop.role_id, orgId: prop.org_id, name: prop.name, value: prop.value, hidden: prop.hidden }
          );
        }
      }

      return roleRow;
    });

    return { success: true, data: mapRoleFromDb(role) };
  } catch (error) {
    logger.error('Failed to create role', { error, input });
    return { success: false, error: error as Error };
  }
}

export async function getRole(
  db: Database,
  orgId: string,
  roleId: string
): Promise<Result<RoleWithProperties | null>> {
  try {
    const roleRow = await db.oneOrNone<RoleDbRow>(
      `SELECT * FROM role WHERE id = $(roleId) AND org_id = $(orgId)`,
      { roleId, orgId }
    );

    if (!roleRow) {
      return { success: true, data: null };
    }

    const propertiesResult = await getRoleProperties(db, orgId, roleId, false);
    if (!propertiesResult.success) {
      throw propertiesResult.error;
    }
    
    const role = mapRoleFromDb(roleRow);

    const result: RoleWithProperties = {
      ...role,
      properties: propertiesResult.data.reduce((acc, prop) => {
        acc[prop.name] = prop.value;
        return acc;
      }, {} as Record<string, string>)
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get role', { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}

export async function getRoles(
  db: Database,
  orgId: string,
  filters?: {
    ids?: string[];
    properties?: PropertyFilter[];
  },
  pagination?: PaginationInput
): Promise<Result<RoleWithProperties[]>> {
  try {
    let query = `
      SELECT DISTINCT r.* 
      FROM role r
    `;
    const params: Record<string, any> = { orgId };

    if (filters?.properties && filters.properties.length > 0) {
      query += ` LEFT JOIN role_property rp ON r.id = rp.role_id AND r.org_id = rp.org_id`;
    }

    const conditions: string[] = [`r.org_id = $(orgId)`];

    if (filters?.ids && filters.ids.length > 0) {
      conditions.push(`r.id = ANY($(ids))`);
      params.ids = filters.ids;
    }

    if (filters?.properties && filters.properties.length > 0) {
      filters.properties.forEach((prop, index) => {
        const nameParam = `propName${index}`;
        const valueParam = `propValue${index}`;
        conditions.push(`(rp.name = $(${nameParam}) AND rp.value = $(${valueParam}))`);
        params[nameParam] = prop.name;
        params[valueParam] = prop.value;
      });
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY r.created_at DESC`;

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await db.manyOrNone<RoleDbRow>(query, params);
    const roles = rows.map(mapRoleFromDb);

    const result = await Promise.all(
      roles.map(async (role) => {
        const propertiesResult = await getRoleProperties(db, role.orgId, role.id, false);
        if (!propertiesResult.success) {
          throw propertiesResult.error;
        }
        return {
          ...role,
          properties: propertiesResult.data.reduce((acc, prop) => {
            acc[prop.name] = prop.value;
            return acc;
          }, {} as Record<string, string>)
        };
      })
    );

    return { success: true, data: result };
  } catch (error) {
    logger.error('Failed to get roles', { error, orgId, filters });
    return { success: false, error: error as Error };
  }
}

export async function updateRole(
  db: Database,
  orgId: string,
  roleId: string,
  input: UpdateRoleInput
): Promise<Result<Role>> {
  try {
    const updates: string[] = [];
    const params: Record<string, any> = { roleId, orgId };

    if (input.name !== undefined) {
      updates.push(`name = $(name)`);
      params.name = input.name;
    }
    
    if (input.description !== undefined) {
      updates.push(`description = $(description)`);
      params.description = input.description;
    }
    
    if (input.data !== undefined) {
      updates.push(`data = $(data)`);
      params.data = input.data;
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE role 
      SET ${updates.join(', ')}
      WHERE id = $(roleId) AND org_id = $(orgId)
      RETURNING *
    `;

    const row = await db.one<RoleDbRow>(query, params);
    return { success: true, data: mapRoleFromDb(row) };
  } catch (error) {
    logger.error('Failed to update role', { error, orgId, roleId, input });
    return { success: false, error: error as Error };
  }
}

export async function deleteRole(
  db: Database,
  orgId: string,
  roleId: string
): Promise<Result<boolean>> {
  try {
    await db.none(`DELETE FROM role WHERE id = $(roleId) AND org_id = $(orgId)`, { roleId, orgId });
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete role', { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}

export async function getRoleProperties(
  db: Database,
  orgId: string,
  roleId: string,
  includeHidden: boolean = true
): Promise<Result<RoleProperty[]>> {
  try {
    const query = includeHidden
      ? `SELECT * FROM role_property WHERE role_id = $(roleId) AND org_id = $(orgId)`
      : `SELECT * FROM role_property WHERE role_id = $(roleId) AND org_id = $(orgId) AND hidden = false`;

    const rows = await db.manyOrNone<RolePropertyDbRow>(query, { roleId, orgId });
    return { success: true, data: rows.map(mapRolePropertyFromDb) };
  } catch (error) {
    logger.error('Failed to get role properties', { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}

export async function setRoleProperty(
  db: Database,
  orgId: string,
  roleId: string,
  name: string,
  value: string,
  hidden: boolean = false
): Promise<Result<RoleProperty>> {
  try {
    const row = await db.one<RolePropertyDbRow>(
      `INSERT INTO role_property (role_id, org_id, name, value, hidden) 
       VALUES ($(roleId), $(orgId), $(name), $(value), $(hidden)) 
       ON CONFLICT (role_id, org_id, name) 
       DO UPDATE SET value = $(value), hidden = $(hidden), created_at = NOW()
       RETURNING *`,
      { roleId, orgId, name, value, hidden }
    );

    return { success: true, data: mapRolePropertyFromDb(row) };
  } catch (error) {
    logger.error('Failed to set role property', { error, orgId, roleId, name });
    return { success: false, error: error as Error };
  }
}

export async function getRoleProperty(
  db: Database,
  orgId: string,
  roleId: string,
  name: string
): Promise<Result<RoleProperty | null>> {
  try {
    const row = await db.oneOrNone<RolePropertyDbRow>(
      `SELECT * FROM role_property WHERE role_id = $(roleId) AND org_id = $(orgId) AND name = $(name)`,
      { roleId, orgId, name }
    );

    return {
      success: true,
      data: row ? mapRolePropertyFromDb(row) : null
    };
  } catch (error) {
    logger.error('Failed to get role property', { error, orgId, roleId, name });
    return { success: false, error: error as Error };
  }
}

export async function deleteRoleProperty(
  db: Database,
  orgId: string,
  roleId: string,
  name: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM role_property WHERE role_id = $(roleId) AND org_id = $(orgId) AND name = $(name)`,
      { roleId, orgId, name }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete role property', { error, orgId, roleId, name });
    return { success: false, error: error as Error };
  }
}

export async function getRoleUsers(
  db: Database,
  orgId: string,
  roleId: string
): Promise<Result<string[]>> {
  try {
    const rows = await db.manyOrNone<{ user_id: string }>(
      `SELECT user_id FROM user_role WHERE role_id = $(roleId) AND org_id = $(orgId)`,
      { roleId, orgId }
    );

    return { success: true, data: rows.map(r => r.user_id) };
  } catch (error) {
    logger.error('Failed to get role users', { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}