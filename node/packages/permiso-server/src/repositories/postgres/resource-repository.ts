/**
 * PostgreSQL Resource Repository
 */

import { createLogger } from "@codespin/permiso-logger";
import { sql, type Database } from "@codespin/permiso-db";
import type {
  IResourceRepository,
  Resource,
  ResourceFilter,
  CreateResourceInput,
  UpdateResourceInput,
  PaginationInput,
  Connection,
  Result,
} from "../interfaces/index.js";
import type { ResourceDbRow } from "../../types.js";

const logger = createLogger("permiso-server:repos:postgres:resource");

function mapResourceFromDb(row: ResourceDbRow): Resource {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function createResourceRepository(
  db: Database,
  _orgId: string,
): IResourceRepository {
  return {
    async create(
      inputOrgId: string,
      input: CreateResourceInput,
    ): Promise<Result<Resource>> {
      try {
        const now = Date.now();
        const params = {
          id: input.id,
          org_id: inputOrgId,
          name: input.name ?? null,
          description: input.description ?? null,
          created_at: now,
          updated_at: now,
        };

        const row = await db.one<ResourceDbRow>(
          `${sql.insert("resource", params)} RETURNING *`,
          params,
        );

        return { success: true, data: mapResourceFromDb(row) };
      } catch (error) {
        logger.error("Failed to create resource", { error, input });
        return { success: false, error: error as Error };
      }
    },

    async getById(
      inputOrgId: string,
      resourceId: string,
    ): Promise<Result<Resource | null>> {
      try {
        const row = await db.oneOrNone<ResourceDbRow>(
          `SELECT * FROM resource WHERE id = $(resourceId) AND org_id = $(orgId)`,
          { resourceId, orgId: inputOrgId },
        );
        return { success: true, data: row ? mapResourceFromDb(row) : null };
      } catch (error) {
        logger.error("Failed to get resource", { error, resourceId });
        return { success: false, error: error as Error };
      }
    },

    async list(
      inputOrgId: string,
      filter?: ResourceFilter,
      pagination?: PaginationInput,
    ): Promise<Result<Connection<Resource>>> {
      try {
        let whereClause = "WHERE org_id = $(orgId)";
        const params: Record<string, unknown> = { orgId: inputOrgId };

        if (filter?.idPrefix) {
          whereClause += " AND id LIKE $(idPrefix)";
          params.idPrefix = `${filter.idPrefix}%`;
        }

        const countResult = await db.one<{ count: string }>(
          `SELECT COUNT(*) as count FROM resource ${whereClause}`,
          params,
        );
        const totalCount = parseInt(countResult.count, 10);

        let query = `SELECT * FROM resource ${whereClause} ORDER BY id ASC`;
        if (pagination?.first) {
          query += ` LIMIT $(limit)`;
          params.limit = pagination.first;
        }

        const rows = await db.manyOrNone<ResourceDbRow>(query, params);

        return {
          success: true,
          data: {
            nodes: rows.map(mapResourceFromDb),
            totalCount,
            pageInfo: {
              hasNextPage: pagination?.first
                ? rows.length === pagination.first
                : false,
              hasPreviousPage: false,
              startCursor: rows[0]?.id ?? null,
              endCursor: rows[rows.length - 1]?.id ?? null,
            },
          },
        };
      } catch (error) {
        logger.error("Failed to list resources", { error });
        return { success: false, error: error as Error };
      }
    },

    async listByOrg(
      inputOrgId: string,
      pagination?: PaginationInput,
    ): Promise<Result<Connection<Resource>>> {
      return this.list(inputOrgId, undefined, pagination);
    },

    async listByIdPrefix(
      inputOrgId: string,
      idPrefix: string,
    ): Promise<Result<Resource[]>> {
      try {
        const rows = await db.manyOrNone<ResourceDbRow>(
          `SELECT * FROM resource WHERE org_id = $(orgId) AND id LIKE $(idPrefix) ORDER BY id ASC`,
          { orgId: inputOrgId, idPrefix: `${idPrefix}%` },
        );
        return { success: true, data: rows.map(mapResourceFromDb) };
      } catch (error) {
        logger.error("Failed to list resources by prefix", { error, idPrefix });
        return { success: false, error: error as Error };
      }
    },

    async update(
      inputOrgId: string,
      resourceId: string,
      input: UpdateResourceInput,
    ): Promise<Result<Resource>> {
      try {
        const now = Date.now();
        const updateParams: Record<string, unknown> = { updated_at: now };

        if (input.name !== undefined) {
          updateParams.name = input.name;
        }
        if (input.description !== undefined) {
          updateParams.description = input.description;
        }

        const row = await db.one<ResourceDbRow>(
          `${sql.update("resource", updateParams)} WHERE id = $(resourceId) AND org_id = $(orgId) RETURNING *`,
          { ...updateParams, resourceId, orgId: inputOrgId },
        );

        return { success: true, data: mapResourceFromDb(row) };
      } catch (error) {
        logger.error("Failed to update resource", { error, resourceId });
        return { success: false, error: error as Error };
      }
    },

    async delete(
      inputOrgId: string,
      resourceId: string,
    ): Promise<Result<boolean>> {
      try {
        await db.tx(async (t) => {
          // Delete related permissions first
          await t.none(
            `DELETE FROM user_permission WHERE resource_id = $(resourceId) AND org_id = $(orgId)`,
            { resourceId, orgId: inputOrgId },
          );
          await t.none(
            `DELETE FROM role_permission WHERE resource_id = $(resourceId) AND org_id = $(orgId)`,
            { resourceId, orgId: inputOrgId },
          );
          await t.none(
            `DELETE FROM resource WHERE id = $(resourceId) AND org_id = $(orgId)`,
            { resourceId, orgId: inputOrgId },
          );
        });
        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to delete resource", { error, resourceId });
        return { success: false, error: error as Error };
      }
    },

    async deleteByIdPrefix(
      inputOrgId: string,
      idPrefix: string,
    ): Promise<Result<number>> {
      try {
        const result = await db.tx(async (t) => {
          // Get all resource IDs matching the prefix
          const resources = await t.manyOrNone<{ id: string }>(
            `SELECT id FROM resource WHERE org_id = $(orgId) AND id LIKE $(idPrefix)`,
            { orgId: inputOrgId, idPrefix: `${idPrefix}%` },
          );

          if (resources.length === 0) {
            return 0;
          }

          const resourceIds = resources.map((r) => r.id);

          // Delete related permissions
          await t.none(
            `DELETE FROM user_permission WHERE org_id = $(orgId) AND resource_id = ANY($(resourceIds))`,
            { orgId: inputOrgId, resourceIds },
          );
          await t.none(
            `DELETE FROM role_permission WHERE org_id = $(orgId) AND resource_id = ANY($(resourceIds))`,
            { orgId: inputOrgId, resourceIds },
          );

          // Delete resources
          const deleteResult = await t.result(
            `DELETE FROM resource WHERE org_id = $(orgId) AND id LIKE $(idPrefix)`,
            { orgId: inputOrgId, idPrefix: `${idPrefix}%` },
          );

          return deleteResult.rowCount;
        });

        return { success: true, data: result };
      } catch (error) {
        logger.error("Failed to delete resources by prefix", {
          error,
          idPrefix,
        });
        return { success: false, error: error as Error };
      }
    },
  };
}
