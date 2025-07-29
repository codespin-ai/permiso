import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '../db.js';
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
  mapRoleToDb,
  mapRolePropertyFromDb,
  mapRolePropertyToDb
} from '../mappers.js';

const logger = createLogger('permiso-rbac:roles');

export async function createRole(
  db: Database,
  input: CreateRoleInput
): Promise<Result<Role>> {
  try {
    const role = await db.tx(async (t) => {
      const roleRow = await t.one<RoleDbRow>(
        `INSERT INTO role (id, org_id, data) VALUES ($1, $2, $3) RETURNING *`,
        [input.id, input.orgId, input.data ?? null]
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
            `INSERT INTO role_property (role_id, org_id, name, value, hidden) VALUES ($1, $2, $3, $4, $5)`,
            [prop.role_id, prop.org_id, prop.name, prop.value, prop.hidden]
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
      `SELECT * FROM role WHERE id = $1 AND org_id = $2`,
      [roleId, orgId]
    );

    if (!roleRow) {
      return { success: true, data: null };
    }

    const properties = await getRoleProperties(db, orgId, roleId, false);
    const role = mapRoleFromDb(roleRow);

    const result: RoleWithProperties = {
      ...role,
      properties: properties.reduce((acc, prop) => {
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
    const params: any[] = [orgId];
    let paramCount = 1;

    if (filters?.properties && filters.properties.length > 0) {
      query += ` LEFT JOIN role_property rp ON r.id = rp.role_id AND r.org_id = rp.org_id`;
    }

    const conditions: string[] = [`r.org_id = $1`];

    if (filters?.ids && filters.ids.length > 0) {
      conditions.push(`r.id = ANY($${++paramCount})`);
      params.push(filters.ids);
    }

    if (filters?.properties && filters.properties.length > 0) {
      filters.properties.forEach(prop => {
        conditions.push(`(rp.name = $${++paramCount} AND rp.value = $${++paramCount})`);
        params.push(prop.name, prop.value);
      });
    }

    query += ` WHERE ${conditions.join(' AND ')}`;
    query += ` ORDER BY r.created_at DESC`;

    if (pagination?.limit) {
      query += ` LIMIT $${++paramCount}`;
      params.push(pagination.limit);
    }

    if (pagination?.offset) {
      query += ` OFFSET $${++paramCount}`;
      params.push(pagination.offset);
    }

    const rows = await db.manyOrNone<RoleDbRow>(query, params);
    const roles = rows.map(mapRoleFromDb);

    const result = await Promise.all(
      roles.map(async (role) => {
        const properties = await getRoleProperties(db, role.orgId, role.id, false);
        return {
          ...role,
          properties: properties.reduce((acc, prop) => {
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
    const params: any[] = [roleId, orgId];
    let paramCount = 2;

    if (input.data !== undefined) {
      updates.push(`data = $${++paramCount}`);
      params.push(input.data);
    }

    updates.push(`updated_at = NOW()`);

    const query = `
      UPDATE role 
      SET ${updates.join(', ')}
      WHERE id = $1 AND org_id = $2
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
    await db.none(`DELETE FROM role WHERE id = $1 AND org_id = $2`, [roleId, orgId]);
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete role', { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}

async function getRoleProperties(
  db: Database,
  orgId: string,
  roleId: string,
  includeHidden: boolean
): Promise<RoleProperty[]> {
  const query = includeHidden
    ? `SELECT * FROM role_property WHERE role_id = $1 AND org_id = $2`
    : `SELECT * FROM role_property WHERE role_id = $1 AND org_id = $2 AND hidden = false`;

  const rows = await db.manyOrNone<RolePropertyDbRow>(query, [roleId, orgId]);
  return rows.map(mapRolePropertyFromDb);
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
       VALUES ($1, $2, $3, $4, $5) 
       ON CONFLICT (role_id, org_id, name) 
       DO UPDATE SET value = $4, hidden = $5, created_at = NOW()
       RETURNING *`,
      [roleId, orgId, name, value, hidden]
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
      `SELECT * FROM role_property WHERE role_id = $1 AND org_id = $2 AND name = $3`,
      [roleId, orgId, name]
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
      `DELETE FROM role_property WHERE role_id = $1 AND org_id = $2 AND name = $3`,
      [roleId, orgId, name]
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
      `SELECT user_id FROM user_role WHERE role_id = $1 AND org_id = $2`,
      [roleId, orgId]
    );

    return { success: true, data: rows.map(r => r.user_id) };
  } catch (error) {
    logger.error('Failed to get role users', { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}