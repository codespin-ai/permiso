import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:organizations');

export async function deleteOrganizationProperty(
  db: Database,
  orgId: string,
  name: string
): Promise<Result<boolean>> {
  try {
    await db.none(
      `DELETE FROM organization_property WHERE org_id = $(orgId) AND name = $(name)`,
      { orgId, name }
    );
    return { success: true, data: true };
  } catch (error) {
    logger.error('Failed to delete organization property', { error, orgId, name });
    return { success: false, error: error as Error };
  }
}

export const deleteOrganizationPropertyResolver = {
  Mutation: {
    deleteOrganizationProperty: async (_: any, args: { orgId: string; name: string }, context: { db: Database }) => {
      const result = await deleteOrganizationProperty(context.db, args.orgId, args.name);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};