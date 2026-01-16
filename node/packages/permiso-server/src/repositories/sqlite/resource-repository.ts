/**
 * SQLite Resource Repository
 *
 * Uses Tinqer for type-safe queries with app-level tenant filtering.
 */

import { createLogger } from "@codespin/permiso-logger";
import {
  executeSelect,
  executeInsert,
  executeDelete,
} from "@tinqerjs/better-sqlite3-adapter";
import type { Database } from "better-sqlite3";
import { schema } from "../tinqer-schema.js";
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

const logger = createLogger("permiso-server:repos:sqlite:resource");

function mapResourceFromDb(row: {
  id: string;
  org_id: string;
  name: string | null;
  description: string | null;
  created_at: number;
  updated_at: number;
}): Resource {
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

        executeInsert(
          db,
          schema,
          (q, p: {
            id: string;
            org_id: string;
            name: string | null;
            description: string | null;
            created_at: number;
            updated_at: number;
          }) =>
            q.insertInto("resource").values({
              id: p.id,
              org_id: p.org_id,
              name: p.name,
              description: p.description,
              created_at: p.created_at,
              updated_at: p.updated_at,
            }),
          {
            id: input.id,
            org_id: inputOrgId,
            name: input.name ?? null,
            description: input.description ?? null,
            created_at: now,
            updated_at: now,
          },
        );

        // Get the created resource
        const rows = executeSelect(
          db,
          schema,
          (q, p: { id: string; org_id: string }) =>
            q.from("resource").where((r) => r.id === p.id && r.org_id === p.org_id),
          { id: input.id, org_id: inputOrgId },
        );

        if (!rows[0]) {
          return { success: false, error: new Error("Resource not found after creation") };
        }

        return { success: true, data: mapResourceFromDb(rows[0]) };
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
        const rows = executeSelect(
          db,
          schema,
          (q, p: { resourceId: string; orgId: string }) =>
            q.from("resource").where((r) => r.id === p.resourceId && r.org_id === p.orgId),
          { resourceId, orgId: inputOrgId },
        );
        return { success: true, data: rows[0] ? mapResourceFromDb(rows[0]) : null };
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
        // Count and list with raw SQL for LIKE support
        const countStmt = db.prepare(
          filter?.idPrefix
            ? `SELECT COUNT(*) as count FROM resource WHERE org_id = @orgId AND id LIKE @idPrefix`
            : `SELECT COUNT(*) as count FROM resource WHERE org_id = @orgId`,
        );
        const countResult = countStmt.get({
          orgId: inputOrgId,
          ...(filter?.idPrefix ? { idPrefix: `${filter.idPrefix}%` } : {}),
        }) as { count: number };
        const totalCount = countResult.count;

        const sortDir = pagination?.sortDirection === "DESC" ? "DESC" : "ASC";
        const stmt = db.prepare(
          `SELECT * FROM resource WHERE org_id = @orgId${
            filter?.idPrefix ? " AND id LIKE @idPrefix" : ""
          } ORDER BY id ${sortDir}${pagination?.first ? " LIMIT @limit" : ""}${pagination?.offset ? " OFFSET @offset" : ""}`,
        );
        const rows = stmt.all({
          orgId: inputOrgId,
          ...(filter?.idPrefix ? { idPrefix: `${filter.idPrefix}%` } : {}),
          ...(pagination?.first ? { limit: pagination.first } : {}),
          ...(pagination?.offset ? { offset: pagination.offset } : {}),
        }) as Array<{
          id: string;
          org_id: string;
          name: string | null;
          description: string | null;
          created_at: number;
          updated_at: number;
        }>;

        return {
          success: true,
          data: {
            nodes: rows.map(mapResourceFromDb),
            totalCount,
            pageInfo: {
              hasNextPage: pagination?.first ? rows.length === pagination.first : false,
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
        // Use raw SQL for LIKE
        const stmt = db.prepare(
          `SELECT * FROM resource WHERE org_id = @orgId AND id LIKE @idPrefix ORDER BY id ASC`,
        );
        const rows = stmt.all({
          orgId: inputOrgId,
          idPrefix: `${idPrefix}%`,
        }) as Array<{
          id: string;
          org_id: string;
          name: string | null;
          description: string | null;
          created_at: number;
          updated_at: number;
        }>;
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

        // Build partial update with raw SQL
        const updates: string[] = ["updated_at = @updated_at"];
        const params: Record<string, unknown> = { resourceId, orgId: inputOrgId, updated_at: now };

        if (input.name !== undefined) {
          updates.push("name = @name");
          params.name = input.name;
        }
        if (input.description !== undefined) {
          updates.push("description = @description");
          params.description = input.description;
        }

        const stmt = db.prepare(
          `UPDATE resource SET ${updates.join(", ")} WHERE id = @resourceId AND org_id = @orgId`,
        );
        stmt.run(params);

        // Get updated resource
        const rows = executeSelect(
          db,
          schema,
          (q, p: { resourceId: string; orgId: string }) =>
            q.from("resource").where((r) => r.id === p.resourceId && r.org_id === p.orgId),
          { resourceId, orgId: inputOrgId },
        );

        if (!rows[0]) {
          return { success: false, error: new Error("Resource not found") };
        }

        return { success: true, data: mapResourceFromDb(rows[0]) };
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
        const deleteAll = db.transaction(() => {
          executeDelete(
            db,
            schema,
            (q, p: { resourceId: string; orgId: string }) =>
              q.deleteFrom("user_permission").where(
                (up) => up.resource_id === p.resourceId && up.org_id === p.orgId,
              ),
            { resourceId, orgId: inputOrgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { resourceId: string; orgId: string }) =>
              q.deleteFrom("role_permission").where(
                (rp) => rp.resource_id === p.resourceId && rp.org_id === p.orgId,
              ),
            { resourceId, orgId: inputOrgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { resourceId: string; orgId: string }) =>
              q.deleteFrom("resource").where((r) => r.id === p.resourceId && r.org_id === p.orgId),
            { resourceId, orgId: inputOrgId },
          );
        });

        deleteAll();
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
        const result = db.transaction(() => {
          // Get all resource IDs matching the prefix
          const stmt = db.prepare(
            `SELECT id FROM resource WHERE org_id = @orgId AND id LIKE @idPrefix`,
          );
          const resources = stmt.all({
            orgId: inputOrgId,
            idPrefix: `${idPrefix}%`,
          }) as Array<{ id: string }>;

          if (resources.length === 0) {
            return 0;
          }

          // Delete related permissions for each resource
          for (const res of resources) {
            executeDelete(
              db,
              schema,
              (q, p: { resId: string; orgId: string }) =>
                q.deleteFrom("user_permission").where(
                  (up) => up.resource_id === p.resId && up.org_id === p.orgId,
                ),
              { resId: res.id, orgId: inputOrgId },
            );
            executeDelete(
              db,
              schema,
              (q, p: { resId: string; orgId: string }) =>
                q.deleteFrom("role_permission").where(
                  (rp) => rp.resource_id === p.resId && rp.org_id === p.orgId,
                ),
              { resId: res.id, orgId: inputOrgId },
            );
          }

          // Delete resources using raw SQL for LIKE
          const deleteStmt = db.prepare(
            `DELETE FROM resource WHERE org_id = @orgId AND id LIKE @idPrefix`,
          );
          const deleteResult = deleteStmt.run({
            orgId: inputOrgId,
            idPrefix: `${idPrefix}%`,
          });

          return deleteResult.changes;
        })();

        return { success: true, data: result };
      } catch (error) {
        logger.error("Failed to delete resources by prefix", { error, idPrefix });
        return { success: false, error: error as Error };
      }
    },
  };
}
