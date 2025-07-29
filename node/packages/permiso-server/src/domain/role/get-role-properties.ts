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