import type { Database } from '@codespin/permiso-db';
import { updateOrganization } from '../../domain/organization/update-organization.js';
import { getOrganization } from '../../domain/organization/get-organization.js';

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