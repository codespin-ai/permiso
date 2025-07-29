import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';

const logger = createLogger('permiso-server:roles');

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

export const deleteRolePropertyResolver = {
  Mutation: {
    deleteRoleProperty: async (_: any, args: { orgId: string; roleId: string; name: string }, context: { db: Database }) => {
      const result = await deleteRoleProperty(context.db, args.orgId, args.roleId, args.name);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};