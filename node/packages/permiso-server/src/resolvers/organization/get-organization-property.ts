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

export async function getOrganizationProperty(
  db: Database,
  orgId: string,
  name: string
): Promise<Result<OrganizationProperty | null>> {
  try {
    const row = await db.oneOrNone<OrganizationPropertyDbRow>(
      `SELECT * FROM organization_property WHERE org_id = $(orgId) AND name = $(name)`,
      { orgId, name }
    );

    return {
      success: true,
      data: row ? mapOrganizationPropertyFromDb(row) : null
    };
  } catch (error) {
    logger.error('Failed to get organization property', { error, orgId, name });
    return { success: false, error: error as Error };
  }
}

export const getOrganizationPropertyResolver = {
  Query: {
    organizationProperty: async (_: any, args: { orgId: string; propertyName: string }, context: { db: Database }) => {
      const result = await getOrganizationProperty(context.db, args.orgId, args.propertyName);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};