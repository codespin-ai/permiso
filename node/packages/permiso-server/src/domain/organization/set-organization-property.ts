import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  OrganizationProperty,
  OrganizationPropertyDbRow
} from '../../types.js';
import {
  mapOrganizationPropertyFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:organizations');

export async function setOrganizationProperty(
  db: Database,
  orgId: string,
  name: string,
  value: string,
  hidden: boolean = false
): Promise<Result<OrganizationProperty>> {
  try {
    const row = await db.one<OrganizationPropertyDbRow>(
      `INSERT INTO organization_property (org_id, name, value, hidden) 
       VALUES ($(orgId), $(name), $(value), $(hidden)) 
       ON CONFLICT (org_id, name) 
       DO UPDATE SET value = EXCLUDED.value, hidden = EXCLUDED.hidden, created_at = NOW()
       RETURNING *`,
      { orgId, name, value, hidden }
    );

    return { success: true, data: mapOrganizationPropertyFromDb(row) };
  } catch (error) {
    logger.error('Failed to set organization property', { error, orgId, name });
    return { success: false, error: error as Error };
  }
}