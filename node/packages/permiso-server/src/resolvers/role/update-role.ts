import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  Role,
  RoleDbRow
} from '../../types.js';
import type {
  UpdateRoleInput
} from '../../generated/graphql.js';
import {
  mapRoleFromDb
} from '../../mappers.js';
import { getRole } from './get-role.js';

const logger = createLogger('permiso-server:roles');

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

export const updateRoleResolver = {
  Mutation: {
    updateRole: async (_: any, args: { orgId: string; roleId: string; input: any }, context: { db: Database }) => {
      const result = await updateRole(context.db, args.orgId, args.roleId, args.input);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch with properties
      const roleResult = await getRole(context.db, args.orgId, args.roleId);
      if (!roleResult.success) {
        throw roleResult.error;
      }
      return roleResult.data;
    }
  }
};