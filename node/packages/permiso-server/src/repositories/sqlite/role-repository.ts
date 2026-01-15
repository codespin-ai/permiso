/**
 * SQLite Role Repository
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
  IRoleRepository,
  Role,
  RoleFilter,
  CreateRoleInput,
  UpdateRoleInput,
  Property,
  PropertyInput,
  PaginationInput,
  Connection,
  Result,
} from "../interfaces/index.js";

const logger = createLogger("permiso-server:repos:sqlite:role");

function mapRoleFromDb(row: {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
}): Role {
  return {
    id: row.id,
    orgId: row.org_id,
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

export function createRoleRepository(
  db: Database,
  _orgId: string,
): IRoleRepository {
  return {
    async create(
      inputOrgId: string,
      input: CreateRoleInput,
    ): Promise<Result<Role>> {
      try {
        const now = Date.now();

        executeInsert(
          db,
          schema,
          (q, p: {
            id: string;
            org_id: string;
            name: string;
            description: string | null;
            created_at: number;
            updated_at: number;
          }) =>
            q.insertInto("role").values({
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
              (q, p: {
                parent_id: string;
                org_id: string;
                name: string;
                value: string;
                hidden: number;
                created_at: number;
              }) =>
                q.insertInto("role_property").values({
                  parent_id: p.parent_id,
                  org_id: p.org_id,
                  name: p.name,
                  value: p.value,
                  hidden: p.hidden,
                  created_at: p.created_at,
                }),
              {
                parent_id: input.id,
                org_id: inputOrgId,
                name: prop.name,
                value: prop.value === undefined ? "null" : JSON.stringify(prop.value),
                hidden: prop.hidden ? 1 : 0,
                created_at: now,
              },
            );
          }
        }

        // Get the created role
        const rows = executeSelect(
          db,
          schema,
          (q, p: { id: string; org_id: string }) =>
            q.from("role").where((r) => r.id === p.id && r.org_id === p.org_id),
          { id: input.id, org_id: inputOrgId },
        );

        if (!rows[0]) {
          return { success: false, error: new Error("Role not found after creation") };
        }

        return { success: true, data: mapRoleFromDb(rows[0]) };
      } catch (error) {
        logger.error("Failed to create role", { error, input });
        return { success: false, error: error as Error };
      }
    },

    async getById(
      inputOrgId: string,
      roleId: string,
    ): Promise<Result<Role | null>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q.from("role").where((r) => r.id === p.roleId && r.org_id === p.orgId),
          { roleId, orgId: inputOrgId },
        );
        return { success: true, data: rows[0] ? mapRoleFromDb(rows[0]) : null };
      } catch (error) {
        logger.error("Failed to get role", { error, roleId });
        return { success: false, error: error as Error };
      }
    },

    async list(
      inputOrgId: string,
      filter?: RoleFilter,
      pagination?: PaginationInput,
    ): Promise<Result<Connection<Role>>> {
      try {
        // Count and list with raw SQL for LIKE support
        const countStmt = db.prepare(
          filter?.name
            ? `SELECT COUNT(*) as count FROM role WHERE org_id = @orgId AND name LIKE @name`
            : `SELECT COUNT(*) as count FROM role WHERE org_id = @orgId`,
        );
        const countResult = countStmt.get({
          orgId: inputOrgId,
          ...(filter?.name ? { name: `%${filter.name}%` } : {}),
        }) as { count: number };
        const totalCount = countResult.count;

        const stmt = db.prepare(
          `SELECT * FROM role WHERE org_id = @orgId${
            filter?.name ? " AND name LIKE @name" : ""
          } ORDER BY created_at DESC${pagination?.first ? " LIMIT @limit" : ""}`,
        );
        const rows = stmt.all({
          orgId: inputOrgId,
          ...(filter?.name ? { name: `%${filter.name}%` } : {}),
          ...(pagination?.first ? { limit: pagination.first } : {}),
        }) as Array<{
          id: string;
          org_id: string;
          name: string;
          description: string | null;
          created_at: number;
          updated_at: number;
        }>;

        return {
          success: true,
          data: {
            nodes: rows.map(mapRoleFromDb),
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
        logger.error("Failed to list roles", { error });
        return { success: false, error: error as Error };
      }
    },

    async listByOrg(
      inputOrgId: string,
      pagination?: PaginationInput,
    ): Promise<Result<Connection<Role>>> {
      return this.list(inputOrgId, undefined, pagination);
    },

    async update(
      inputOrgId: string,
      roleId: string,
      input: UpdateRoleInput,
    ): Promise<Result<Role>> {
      try {
        const now = Date.now();

        // Build partial update with raw SQL
        const updates: string[] = ["updated_at = @updated_at"];
        const params: Record<string, unknown> = { roleId, orgId: inputOrgId, updated_at: now };

        if (input.name !== undefined) {
          updates.push("name = @name");
          params.name = input.name;
        }
        if (input.description !== undefined) {
          updates.push("description = @description");
          params.description = input.description;
        }

        const stmt = db.prepare(
          `UPDATE role SET ${updates.join(", ")} WHERE id = @roleId AND org_id = @orgId`,
        );
        stmt.run(params);

        // Get updated role
        const rows = executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q.from("role").where((r) => r.id === p.roleId && r.org_id === p.orgId),
          { roleId, orgId: inputOrgId },
        );

        if (!rows[0]) {
          return { success: false, error: new Error("Role not found") };
        }

        return { success: true, data: mapRoleFromDb(rows[0]) };
      } catch (error) {
        logger.error("Failed to update role", { error, roleId });
        return { success: false, error: error as Error };
      }
    },

    async delete(inputOrgId: string, roleId: string): Promise<Result<boolean>> {
      try {
        const deleteAll = db.transaction(() => {
          executeDelete(
            db,
            schema,
            (q, p: { roleId: string; orgId: string }) =>
              q.deleteFrom("role_property").where(
                (rp) => rp.parent_id === p.roleId && rp.org_id === p.orgId,
              ),
            { roleId, orgId: inputOrgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { roleId: string; orgId: string }) =>
              q.deleteFrom("role_permission").where(
                (rp) => rp.role_id === p.roleId && rp.org_id === p.orgId,
              ),
            { roleId, orgId: inputOrgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { roleId: string; orgId: string }) =>
              q.deleteFrom("user_role").where(
                (ur) => ur.role_id === p.roleId && ur.org_id === p.orgId,
              ),
            { roleId, orgId: inputOrgId },
          );
          executeDelete(
            db,
            schema,
            (q, p: { roleId: string; orgId: string }) =>
              q.deleteFrom("role").where((r) => r.id === p.roleId && r.org_id === p.orgId),
            { roleId, orgId: inputOrgId },
          );
        });

        deleteAll();
        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to delete role", { error, roleId });
        return { success: false, error: error as Error };
      }
    },

    async getUserIds(
      inputOrgId: string,
      roleId: string,
    ): Promise<Result<string[]>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q.from("user_role").where(
              (ur) => ur.role_id === p.roleId && ur.org_id === p.orgId,
            ),
          { roleId, orgId: inputOrgId },
        );
        return { success: true, data: rows.map((r) => r.user_id) };
      } catch (error) {
        logger.error("Failed to get role users", { error, roleId });
        return { success: false, error: error as Error };
      }
    },

    async getProperties(
      inputOrgId: string,
      roleId: string,
    ): Promise<Result<Property[]>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q.from("role_property").where(
              (rp) => rp.parent_id === p.roleId && rp.org_id === p.orgId,
            ),
          { roleId, orgId: inputOrgId },
        );
        return { success: true, data: rows.map(mapPropertyFromDb) };
      } catch (error) {
        logger.error("Failed to get role properties", { error, roleId });
        return { success: false, error: error as Error };
      }
    },

    async getProperty(
      inputOrgId: string,
      roleId: string,
      name: string,
    ): Promise<Result<Property | null>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string; name: string }) =>
            q.from("role_property").where(
              (rp) =>
                rp.parent_id === p.roleId &&
                rp.org_id === p.orgId &&
                rp.name === p.name,
            ),
          { roleId, orgId: inputOrgId, name },
        );
        return { success: true, data: rows[0] ? mapPropertyFromDb(rows[0]) : null };
      } catch (error) {
        logger.error("Failed to get role property", { error, roleId, name });
        return { success: false, error: error as Error };
      }
    },

    async setProperty(
      inputOrgId: string,
      roleId: string,
      property: PropertyInput,
    ): Promise<Result<Property>> {
      try {
        const now = Date.now();
        // Use INSERT OR REPLACE for upsert
        const stmt = db.prepare(
          `INSERT INTO role_property (parent_id, org_id, name, value, hidden, created_at)
           VALUES (@parent_id, @org_id, @name, @value, @hidden, @created_at)
           ON CONFLICT (parent_id, org_id, name)
           DO UPDATE SET value = @value, hidden = @hidden`,
        );
        stmt.run({
          parent_id: roleId,
          org_id: inputOrgId,
          name: property.name,
          value: property.value === undefined ? "null" : JSON.stringify(property.value),
          hidden: property.hidden ? 1 : 0,
          created_at: now,
        });

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
        logger.error("Failed to set role property", { error, roleId, property });
        return { success: false, error: error as Error };
      }
    },

    async deleteProperty(
      inputOrgId: string,
      roleId: string,
      name: string,
    ): Promise<Result<boolean>> {
      try {
        executeDelete(
          db,
          schema,
          (q, p: { roleId: string; orgId: string; name: string }) =>
            q.deleteFrom("role_property").where(
              (rp) =>
                rp.parent_id === p.roleId &&
                rp.org_id === p.orgId &&
                rp.name === p.name,
            ),
          { roleId, orgId: inputOrgId, name },
        );
        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to delete role property", { error, roleId, name });
        return { success: false, error: error as Error };
      }
    },
  };
}
