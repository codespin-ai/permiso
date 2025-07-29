import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  RoleProperty,
  RolePropertyDbRow
} from '../../types.js';
import {
  mapRolePropertyFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:roles');

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

export const setRolePropertyResolver = {
  Mutation: {
    setRoleProperty: async (_: any, args: { orgId: string; roleId: string; name: string; value: string; hidden?: boolean }, context: { db: Database }) => {
      const result = await setRoleProperty(context.db, args.orgId, args.roleId, args.name, args.value, args.hidden ?? false);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};