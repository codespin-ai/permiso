import { createLogger } from '@codespin/permiso-logger';
import { Result } from '@codespin/permiso-core';
import type { Database } from '@codespin/permiso-db';
import type {
  Resource,
  ResourceDbRow
} from '../../types.js';
import type {
  PaginationInput
} from '../../generated/graphql.js';
import {
  mapResourceFromDb
} from '../../mappers.js';

const logger = createLogger('permiso-server:resources');

export async function getResources(
  db: Database,
  orgId: string,
  pagination?: PaginationInput
): Promise<Result<Resource[]>> {
  try {
    let query = `SELECT * FROM resource WHERE org_id = $(orgId) ORDER BY created_at DESC`;
    const params: Record<string, any> = { orgId };

    if (pagination?.limit) {
      query += ` LIMIT $(limit)`;
      params.limit = pagination.limit;
    }

    if (pagination?.offset) {
      query += ` OFFSET $(offset)`;
      params.offset = pagination.offset;
    }

    const rows = await db.manyOrNone<ResourceDbRow>(query, params);
    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error('Failed to get resources', { error, orgId });
    return { success: false, error: error as Error };
  }
}

export async function getResourcesByIdPrefix(
  db: Database,
  orgId: string,
  idPrefix: string
): Promise<Result<Resource[]>> {
  try {
    const rows = await db.manyOrNone<ResourceDbRow>(
      `SELECT * FROM resource 
       WHERE org_id = $(orgId) AND id LIKE $(idPattern) 
       ORDER BY id`,
      { orgId, idPattern: `${idPrefix}%` }
    );

    return { success: true, data: rows.map(mapResourceFromDb) };
  } catch (error) {
    logger.error('Failed to get resources by id prefix', { error, orgId, idPrefix });
    return { success: false, error: error as Error };
  }
}

export const getResourcesResolver = {
  Query: {
    resources: async (_: any, args: { orgId: string; filter?: any; pagination?: any }, context: { db: Database }) => {
      let result;
      if (args.filter?.idPrefix) {
        result = await getResourcesByIdPrefix(context.db, args.orgId, args.filter.idPrefix);
      } else {
        result = await getResources(context.db, args.orgId, args.pagination);
      }
      
      if (!result.success) {
        throw result.error;
      }
      return {
        nodes: result.data,
        totalCount: result.data.length,
        pageInfo: {
          hasNextPage: false,
          hasPreviousPage: false,
          startCursor: null,
          endCursor: null
        }
      };
    }
  }
};