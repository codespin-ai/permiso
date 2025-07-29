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