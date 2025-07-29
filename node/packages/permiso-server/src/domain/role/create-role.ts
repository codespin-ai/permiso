import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  Role,
  RoleDbRow
} from '../../types.js';
import type {
  CreateRoleInput
} from '../../generated/graphql.js';
import {
  mapRoleFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:roles');

export async function createRole(
  db: Database,
  input: CreateRoleInput
): Promise<Result<Role>> {
  try {
    const role = await db.tx(async (t) => {
      const roleRow = await t.one<RoleDbRow>(
        `INSERT INTO role (id, org_id, name, description) VALUES ($(id), $(orgId), $(name), $(description)) RETURNING *`,
        { 
          id: input.id, 
          orgId: input.orgId, 
          name: input.name,
          description: input.description ?? null
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