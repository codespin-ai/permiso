import type { Database } from '@codespin/permiso-db';
import { deleteOrganization } from '../../domain/organization/delete-organization.js';

export const deleteOrganizationResolver = {
  Mutation: {
    deleteOrganization: async (_: any, args: { id: string; safetyKey?: string }, context: { db: Database; safetyKey?: string }) => {
      if (context.safetyKey && context.safetyKey !== args.safetyKey) {
        throw new Error('Invalid safety key');
      }
      
      const result = await deleteOrganization(context.db, args.id);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};