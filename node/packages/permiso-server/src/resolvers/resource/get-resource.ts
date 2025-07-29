import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  Resource,
  ResourceDbRow
} from '../../types.js';
import {
  mapResourceFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:resources');

export async function getResource(
  db: Database,
  orgId: string,
  resourceId: string
): Promise<Result<Resource | null>> {
  try {
    const row = await db.oneOrNone<ResourceDbRow>(
      `SELECT * FROM resource WHERE id = $(resourceId) AND org_id = $(orgId)`,
      { resourceId, orgId }
    );

    return {
      success: true,
      data: row ? mapResourceFromDb(row) : null
    };
  } catch (error) {
    logger.error('Failed to get resource', { error, orgId, resourceId });
    return { success: false, error: error as Error };
  }
}

export const getResourceResolver = {
  Query: {
    resource: async (_: any, args: { orgId: string; resourceId: string }, context: { db: Database }) => {
      const result = await getResource(context.db, args.orgId, args.resourceId);
      if (!result.success) {
        throw result.error;
      }
      return result.data;
    }
  }
};