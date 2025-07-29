import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  Organization,
  OrganizationDbRow
} from '../../types.js';
import type {
  UpdateOrganizationInput
} from '../../generated/graphql.js';
import {
  mapOrganizationFromDb
} from '../../mappers.js';
import { getOrganization } from './get-organization.js';

const logger = createLogger('permiso-server:organizations');

export async function updateOrganization(
  db: Database,
  id: string,
  input: UpdateOrganizationInput
): Promise<Result<Organization>> {
  try {
    const updates: string[] = [];
    const params: Record<string, any> = { id };

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
      UPDATE organization 
      SET ${updates.join(', ')}
      WHERE id = $(id)
      RETURNING *
    `;

    const row = await db.one<OrganizationDbRow>(query, params);
    return { success: true, data: mapOrganizationFromDb(row) };
  } catch (error) {
    logger.error('Failed to update organization', { error, id, input });
    return { success: false, error: error as Error };
  }
}

export const updateOrganizationResolver = {
  Mutation: {
    updateOrganization: async (_: any, args: { id: string; input: any }, context: { db: Database }) => {
      const result = await updateOrganization(context.db, args.id, args.input);
      if (!result.success) {
        throw result.error;
      }
      
      // Fetch with properties
      const orgResult = await getOrganization(context.db, args.id);
      if (!orgResult.success) {
        throw orgResult.error;
      }
      return orgResult.data;
    }
  }
};