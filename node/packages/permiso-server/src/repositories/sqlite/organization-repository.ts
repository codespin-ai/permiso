/**
 * SQLite Organization Repository
 *
 * Uses Tinqer for type-safe queries. Organizations are globally accessible (not tenant-scoped).
 */

import { createLogger } from "@codespin/permiso-logger";
import {
  executeSelect,
  executeInsert,
  executeDelete,
} from "@tinqerjs/better-sqlite3-adapter";
import type { Database } from "better-sqlite3";
import { schema } from "./tinqer-schema.js";
import {
  normalizeDbError,
  type IOrganizationRepository,
  type Organization,
  type OrganizationFilter,
  type CreateOrganizationInput,
  type UpdateOrganizationInput,
  type Property,
  type PropertyInput,
  type PaginationInput,
  type Connection,
  type Result,
} from "../interfaces/index.js";

const logger = createLogger("permiso-server:repos:sqlite:organization");

function mapOrganizationFromDb(row: {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
}): Organization {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPropertyFromDb(row: {
  name: string;
  value: string;
  hidden: number;
  created_at: number;
}): Property {
  return {
    name: row.name,
    value: typeof row.value === "string" ? JSON.parse(row.value) : row.value,
    hidden: Boolean(row.hidden),
    createdAt: row.created_at,
  };
}

export function createOrganizationRepository(
  db: Database,
): IOrganizationRepository {
  return {
    async create(
      input: CreateOrganizationInput,
    ): Promise<Result<Organization>> {
      try {
        const now = Date.now();

        executeInsert(
          db,
          schema,
          (
            q,
            p: {
              id: string;
              name: string;
              description: string | null;
              created_at: number;
              updated_at: number;
            },
          ) =>
            q.insertInto("organization").values({
              id: p.id,
              name: p.name,
              description: p.description,
              created_at: p.created_at,
              updated_at: p.updated_at,
            }),
          {
            id: input.id,
            name: input.name,
            description: input.description ?? null,
            created_at: now,
            updated_at: now,
          },
        );

        // Handle properties if provided
        if (input.properties && input.properties.length > 0) {
          for (const prop of input.properties) {
            executeInsert(
              db,
              schema,
              (
                q,
                p: {
                  parent_id: string;
                  name: string;
                  value: string;
                  hidden: number;
                  created_at: number;
                },
              ) =>
                q.insertInto("organization_property").values({
                  parent_id: p.parent_id,
                  name: p.name,
                  value: p.value,
                  hidden: p.hidden,
                  created_at: p.created_at,
                }),
              {
                parent_id: input.id,
                name: prop.name,
                value:
                  prop.value === undefined
                    ? "null"
                    : JSON.stringify(prop.value),
                hidden: prop.hidden ? 1 : 0,
                created_at: now,
              },
            );
          }
        }

        // Get the created organization
        const rows = executeSelect(
          db,
          schema,
          (q, p: { id: string }) =>
            q.from("organization").where((o) => o.id === p.id),
          { id: input.id },
        );

        if (!rows[0]) {
          return {
            success: false,
            error: new Error("Organization not found after creation"),
          };
        }

        return { success: true, data: mapOrganizationFromDb(rows[0]) };
      } catch (error) {
        logger.error("Failed to create organization", { error, input });
        return { success: false, error: normalizeDbError(error) };
      }
    },

    async getById(orgId: string): Promise<Result<Organization | null>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.from("organization").where((o) => o.id === p.orgId),
          { orgId },
        );
        return {
          success: true,
          data: rows[0] ? mapOrganizationFromDb(rows[0]) : null,
        };
      } catch (error) {
        logger.error("Failed to get organization", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async list(
      filter?: OrganizationFilter,
      pagination?: PaginationInput,
    ): Promise<Result<Connection<Organization>>> {
      try {
        // Count query - use raw SQL for LIKE
        const countStmt = db.prepare(
          filter?.name
            ? `SELECT COUNT(*) as count FROM organization WHERE name LIKE @name`
            : `SELECT COUNT(*) as count FROM organization`,
        );
        const countResult = countStmt.get(
          filter?.name ? { name: `%${filter.name}%` } : {},
        ) as { count: number };
        const totalCount = countResult.count;

        // Main query - use raw SQL for LIKE, ORDER BY, LIMIT, OFFSET
        const sortDir = pagination?.sortDirection === "DESC" ? "DESC" : "ASC";
        const stmt = db.prepare(
          `SELECT * FROM organization${
            filter?.name ? " WHERE name LIKE @name" : ""
          } ORDER BY id ${sortDir}${pagination?.first ? " LIMIT @limit" : ""}${pagination?.offset ? " OFFSET @offset" : ""}`,
        );
        const rows = stmt.all({
          ...(filter?.name ? { name: `%${filter.name}%` } : {}),
          ...(pagination?.first ? { limit: pagination.first } : {}),
          ...(pagination?.offset ? { offset: pagination.offset } : {}),
        }) as Array<{
          id: string;
          name: string;
          description: string | null;
          created_at: number;
          updated_at: number;
        }>;

        return {
          success: true,
          data: {
            nodes: rows.map(mapOrganizationFromDb),
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
        logger.error("Failed to list organizations", { error });
        return { success: false, error: error as Error };
      }
    },

    async update(
      orgId: string,
      input: UpdateOrganizationInput,
    ): Promise<Result<Organization>> {
      try {
        const now = Date.now();

        // Build partial update with raw SQL
        const updates: string[] = ["updated_at = @updated_at"];
        const params: Record<string, unknown> = { orgId, updated_at: now };

        if (input.name !== undefined) {
          updates.push("name = @name");
          params.name = input.name;
        }
        if (input.description !== undefined) {
          updates.push("description = @description");
          params.description = input.description;
        }

        const stmt = db.prepare(
          `UPDATE organization SET ${updates.join(", ")} WHERE id = @orgId`,
        );
        stmt.run(params);

        // Get updated organization
        const rows = executeSelect(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.from("organization").where((o) => o.id === p.orgId),
          { orgId },
        );

        if (!rows[0]) {
          return { success: false, error: new Error("Organization not found") };
        }

        return { success: true, data: mapOrganizationFromDb(rows[0]) };
      } catch (error) {
        logger.error("Failed to update organization", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async delete(orgId: string): Promise<Result<boolean>> {
      try {
        // Delete all related data - use raw SQL for transaction
        const deleteAll = db.transaction(() => {
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q
                .deleteFrom("organization_property")
                .where((op) => op.parent_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q
                .deleteFrom("user_permission")
                .where((up) => up.org_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q
                .deleteFrom("role_permission")
                .where((rp) => rp.org_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q
                .deleteFrom("user_property")
                .where((up) => up.org_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q
                .deleteFrom("role_property")
                .where((rp) => rp.org_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q.deleteFrom("user_role").where((ur) => ur.org_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q.deleteFrom("user").where((u) => u.org_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q.deleteFrom("role").where((r) => r.org_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q.deleteFrom("resource").where((r) => r.org_id === p.orgId),
            { orgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { orgId: string }) =>
              q.deleteFrom("organization").where((o) => o.id === p.orgId),
            { orgId },
          );
        });

        deleteAll();
        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to delete organization", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async getProperties(orgId: string): Promise<Result<Property[]>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q
              .from("organization_property")
              .where((op) => op.parent_id === p.orgId),
          { orgId },
        );
        return { success: true, data: rows.map(mapPropertyFromDb) };
      } catch (error) {
        logger.error("Failed to get organization properties", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async getProperty(
      orgId: string,
      name: string,
    ): Promise<Result<Property | null>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { orgId: string; name: string }) =>
            q
              .from("organization_property")
              .where((op) => op.parent_id === p.orgId && op.name === p.name),
          { orgId, name },
        );
        return {
          success: true,
          data: rows[0] ? mapPropertyFromDb(rows[0]) : null,
        };
      } catch (error) {
        logger.error("Failed to get organization property", {
          error,
          orgId,
          name,
        });
        return { success: false, error: error as Error };
      }
    },

    async setProperty(
      orgId: string,
      property: PropertyInput,
    ): Promise<Result<Property>> {
      try {
        const now = Date.now();
        const valueStr =
          property.value === undefined
            ? "null"
            : JSON.stringify(property.value);
        const hiddenInt = property.hidden ? 1 : 0;

        executeInsert(
          db,
          schema,
          (
            q,
            p: {
              parentId: string;
              name: string;
              value: string;
              hidden: number;
              createdAt: number;
            },
          ) =>
            q
              .insertInto("organization_property")
              .values({
                parent_id: p.parentId,
                name: p.name,
                value: p.value,
                hidden: p.hidden,
                created_at: p.createdAt,
              })
              .onConflict(
                (op) => op.parent_id,
                (op) => op.name,
              )
              .doUpdateSet({
                value: p.value,
                hidden: p.hidden,
              }),
          {
            parentId: orgId,
            name: property.name,
            value: valueStr,
            hidden: hiddenInt,
            createdAt: now,
          },
        );

        return {
          success: true,
          data: {
            name: property.name,
            value: property.value,
            hidden: property.hidden ?? false,
            createdAt: now,
          },
        };
      } catch (error) {
        logger.error("Failed to set organization property", {
          error,
          orgId,
          property,
        });
        return { success: false, error: error as Error };
      }
    },

    async deleteProperty(
      orgId: string,
      name: string,
    ): Promise<Result<boolean>> {
      try {
        // Use raw SQL to get the number of affected rows
        const stmt = db.prepare(
          `DELETE FROM organization_property WHERE parent_id = @orgId AND name = @name`,
        );
        const result = stmt.run({ orgId, name });
        return { success: true, data: result.changes > 0 };
      } catch (error) {
        logger.error("Failed to delete organization property", {
          error,
          orgId,
          name,
        });
        return { success: false, error: error as Error };
      }
    },
  };
}
