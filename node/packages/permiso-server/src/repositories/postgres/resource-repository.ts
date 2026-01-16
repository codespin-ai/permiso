/**
 * PostgreSQL Resource Repository
 *
 * Uses Tinqer for type-safe queries with app-level tenant filtering.
 */

import { createLogger } from "@codespin/permiso-logger";
import {
  executeSelect,
  executeInsert,
  executeUpdate,
  executeDelete,
} from "@tinqerjs/pg-promise-adapter";
import type { Database } from "@codespin/permiso-db";
import { schema, type ResourceRow } from "./tinqer-schema.js";
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

const logger = createLogger("permiso-server:repos:postgres:resource");

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

        const resourceRows = await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              id: string;
              org_id: string;
              name: string | null;
              description: string | null;
              created_at: number;
              updated_at: number;
            },
          ) =>
            q
              .insertInto("resource")
              .values({
                id: p.id,
                org_id: p.org_id,
                name: p.name,
                description: p.description,
                created_at: p.created_at,
                updated_at: p.updated_at,
              })
              .returning((r) => r),
          {
            id: input.id,
            org_id: inputOrgId,
            name: input.name ?? null,
            description: input.description ?? null,
            created_at: now,
            updated_at: now,
          },
        );

        if (!resourceRows[0]) {
          return {
            success: false,
            error: new Error("Resource not found after creation"),
          };
        }

        return { success: true, data: mapResourceFromDb(resourceRows[0]) };
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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { resourceId: string; orgId: string }) =>
            q
              .from("resource")
              .where((r) => r.id === p.resourceId && r.org_id === p.orgId),
          { resourceId, orgId: inputOrgId },
        );
        return {
          success: true,
          data: rows[0] ? mapResourceFromDb(rows[0]) : null,
        };
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
        let totalCount: number;
        let rows: ResourceRow[];

        if (filter?.idPrefix) {
          // Filtered queries - with idPrefix filter
          totalCount = (await executeSelect(
            db,
            schema,
            (q, p: { orgId: string; idPrefix: string }) =>
              q
                .from("resource")
                .where(
                  (r) => r.org_id === p.orgId && r.id.startsWith(p.idPrefix),
                )
                .count(),
            { orgId: inputOrgId, idPrefix: filter.idPrefix },
          )) as unknown as number;

          rows = await executeSelect(
            db,
            schema,
            (
              q,
              p: {
                orgId: string;
                idPrefix: string;
                first: number;
                offset: number;
              },
            ) =>
              q
                .from("resource")
                .where(
                  (r) => r.org_id === p.orgId && r.id.startsWith(p.idPrefix),
                )
                .orderBy((r) => r.id)
                .skip(p.offset)
                .take(p.first),
            {
              orgId: inputOrgId,
              idPrefix: filter.idPrefix,
              first: pagination?.first ?? 100,
              offset: pagination?.offset ?? 0,
            },
          );
        } else {
          // Non-filtered queries
          totalCount = (await executeSelect(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q
                .from("resource")
                .where((r) => r.org_id === p.orgId)
                .count(),
            { orgId: inputOrgId },
          )) as unknown as number;

          rows = await executeSelect(
            db,
            schema,
            (q, p: { orgId: string; first: number; offset: number }) =>
              q
                .from("resource")
                .where((r) => r.org_id === p.orgId)
                .orderBy((r) => r.id)
                .skip(p.offset)
                .take(p.first),
            {
              orgId: inputOrgId,
              first: pagination?.first ?? 100,
              offset: pagination?.offset ?? 0,
            },
          );
        }

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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { orgId: string; idPrefix: string }) =>
            q
              .from("resource")
              .where((r) => r.org_id === p.orgId && r.id.startsWith(p.idPrefix))
              .orderBy((r) => r.id),
          { orgId: inputOrgId, idPrefix },
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

        const rows = await executeUpdate(
          db,
          schema,
          (
            q,
            p: {
              resourceId: string;
              orgId: string;
              updated_at: number;
              name: string | null | undefined;
              description: string | null | undefined;
            },
          ) =>
            q
              .update("resource")
              .set({
                updated_at: p.updated_at,
                name: p.name,
                description: p.description,
              })
              .where((r) => r.id === p.resourceId && r.org_id === p.orgId)
              .returning((r) => r),
          {
            resourceId,
            orgId: inputOrgId,
            updated_at: now,
            name: input.name,
            description: input.description,
          },
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
        // Delete related permissions first
        await executeDelete(
          db,
          schema,
          (q, p: { resourceId: string; orgId: string }) =>
            q
              .deleteFrom("user_permission")
              .where(
                (up) =>
                  up.resource_id === p.resourceId && up.org_id === p.orgId,
              ),
          { resourceId, orgId: inputOrgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { resourceId: string; orgId: string }) =>
            q
              .deleteFrom("role_permission")
              .where(
                (rp) =>
                  rp.resource_id === p.resourceId && rp.org_id === p.orgId,
              ),
          { resourceId, orgId: inputOrgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { resourceId: string; orgId: string }) =>
            q
              .deleteFrom("resource")
              .where((r) => r.id === p.resourceId && r.org_id === p.orgId),
          { resourceId, orgId: inputOrgId },
        );

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
        // Get all resource IDs matching the prefix
        const resources = await executeSelect(
          db,
          schema,
          (q, p: { orgId: string; idPrefix: string }) =>
            q
              .from("resource")
              .where((r) => r.org_id === p.orgId && r.id.startsWith(p.idPrefix))
              .select((r) => ({ id: r.id })),
          { orgId: inputOrgId, idPrefix },
        );

        if (resources.length === 0) {
          return { success: true, data: 0 };
        }

        // Delete related permissions for each resource
        for (const resource of resources) {
          await executeDelete(
            db,
            schema,
            (q, p: { resourceId: string; orgId: string }) =>
              q
                .deleteFrom("user_permission")
                .where(
                  (up) =>
                    up.resource_id === p.resourceId && up.org_id === p.orgId,
                ),
            { resourceId: resource.id, orgId: inputOrgId },
          );

          await executeDelete(
            db,
            schema,
            (q, p: { resourceId: string; orgId: string }) =>
              q
                .deleteFrom("role_permission")
                .where(
                  (rp) =>
                    rp.resource_id === p.resourceId && rp.org_id === p.orgId,
                ),
            { resourceId: resource.id, orgId: inputOrgId },
          );
        }

        // Delete resources matching the prefix
        const rowCount = await executeDelete(
          db,
          schema,
          (q, p: { orgId: string; idPrefix: string }) =>
            q
              .deleteFrom("resource")
              .where(
                (r) => r.org_id === p.orgId && r.id.startsWith(p.idPrefix),
              ),
          { orgId: inputOrgId, idPrefix },
        );

        return { success: true, data: rowCount };
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
