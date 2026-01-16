/**
 * PostgreSQL Role Repository
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
import { schema, type RoleRow } from "./tinqer-schema.js";
import {
  normalizeDbError,
  type IRoleRepository,
  type Role,
  type RoleFilter,
  type CreateRoleInput,
  type UpdateRoleInput,
  type Property,
  type PropertyInput,
  type PaginationInput,
  type Connection,
  type Result,
} from "../interfaces/index.js";

const logger = createLogger("permiso-server:repos:postgres:role");

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
  hidden: boolean;
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

        const roleRows = await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              id: string;
              org_id: string;
              name: string;
              description: string | null;
              created_at: number;
              updated_at: number;
            },
          ) =>
            q
              .insertInto("role")
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
            name: input.name,
            description: input.description ?? null,
            created_at: now,
            updated_at: now,
          },
        );

        if (input.properties && input.properties.length > 0) {
          for (const prop of input.properties) {
            await executeInsert(
              db,
              schema,
              (
                q,
                p: {
                  parent_id: string;
                  org_id: string;
                  name: string;
                  value: string;
                  hidden: boolean;
                  created_at: number;
                },
              ) =>
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
                value:
                  prop.value === undefined
                    ? "null"
                    : JSON.stringify(prop.value),
                hidden: prop.hidden ?? false,
                created_at: now,
              },
            );
          }
        }

        if (!roleRows[0]) {
          return {
            success: false,
            error: new Error("Role not found after creation"),
          };
        }

        return { success: true, data: mapRoleFromDb(roleRows[0]) };
      } catch (error) {
        logger.error("Failed to create role", { error, input });
        return { success: false, error: normalizeDbError(error) };
      }
    },

    async getById(
      inputOrgId: string,
      roleId: string,
    ): Promise<Result<Role | null>> {
      try {
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q
              .from("role")
              .where((r) => r.id === p.roleId && r.org_id === p.orgId),
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
        let totalCount: number;
        let rows: RoleRow[];

        if (filter?.name) {
          // Filtered queries - with name filter
          totalCount = (await executeSelect(
            db,
            schema,
            (q, p: { orgId: string; namePattern: string }) =>
              q
                .from("role")
                .where(
                  (r) => r.org_id === p.orgId && r.name.includes(p.namePattern),
                )
                .count(),
            { orgId: inputOrgId, namePattern: filter.name },
          )) as unknown as number;

          rows = await executeSelect(
            db,
            schema,
            (
              q,
              p: {
                orgId: string;
                namePattern: string;
                first: number;
                offset: number;
              },
            ) =>
              q
                .from("role")
                .where(
                  (r) => r.org_id === p.orgId && r.name.includes(p.namePattern),
                )
                .orderBy((r) => r.id)
                .skip(p.offset)
                .take(p.first),
            {
              orgId: inputOrgId,
              namePattern: filter.name,
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
                .from("role")
                .where((r) => r.org_id === p.orgId)
                .count(),
            { orgId: inputOrgId },
          )) as unknown as number;

          rows = await executeSelect(
            db,
            schema,
            (q, p: { orgId: string; first: number; offset: number }) =>
              q
                .from("role")
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
            nodes: rows.map(mapRoleFromDb),
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

        const rows = await executeUpdate(
          db,
          schema,
          (
            q,
            p: {
              roleId: string;
              orgId: string;
              updated_at: number;
              name: string | undefined;
              description: string | null | undefined;
            },
          ) =>
            q
              .update("role")
              .set({
                updated_at: p.updated_at,
                name: p.name,
                description: p.description,
              })
              .where((r) => r.id === p.roleId && r.org_id === p.orgId)
              .returning((r) => r),
          {
            roleId,
            orgId: inputOrgId,
            updated_at: now,
            name: input.name,
            description: input.description,
          },
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
        await executeDelete(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q
              .deleteFrom("role_property")
              .where(
                (rp) => rp.parent_id === p.roleId && rp.org_id === p.orgId,
              ),
          { roleId, orgId: inputOrgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q
              .deleteFrom("role_permission")
              .where((rp) => rp.role_id === p.roleId && rp.org_id === p.orgId),
          { roleId, orgId: inputOrgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q
              .deleteFrom("user_role")
              .where((ur) => ur.role_id === p.roleId && ur.org_id === p.orgId),
          { roleId, orgId: inputOrgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q
              .deleteFrom("role")
              .where((r) => r.id === p.roleId && r.org_id === p.orgId),
          { roleId, orgId: inputOrgId },
        );

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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q
              .from("user_role")
              .where((ur) => ur.role_id === p.roleId && ur.org_id === p.orgId),
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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q
              .from("role_property")
              .where(
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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string; name: string }) =>
            q
              .from("role_property")
              .where(
                (rp) =>
                  rp.parent_id === p.roleId &&
                  rp.org_id === p.orgId &&
                  rp.name === p.name,
              ),
          { roleId, orgId: inputOrgId, name },
        );
        return {
          success: true,
          data: rows[0] ? mapPropertyFromDb(rows[0]) : null,
        };
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
        const valueStr =
          property.value === undefined
            ? "null"
            : JSON.stringify(property.value);
        const hiddenBool = property.hidden ?? false;

        await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              parentId: string;
              orgId: string;
              name: string;
              value: string;
              hidden: boolean;
              createdAt: number;
            },
          ) =>
            q
              .insertInto("role_property")
              .values({
                parent_id: p.parentId,
                org_id: p.orgId,
                name: p.name,
                value: p.value,
                hidden: p.hidden,
                created_at: p.createdAt,
              })
              .onConflict(
                (rp) => rp.parent_id,
                (rp) => rp.org_id,
                (rp) => rp.name,
              )
              .doUpdateSet({
                value: p.value,
                hidden: p.hidden,
              }),
          {
            parentId: roleId,
            orgId: inputOrgId,
            name: property.name,
            value: valueStr,
            hidden: hiddenBool,
            createdAt: now,
          },
        );

        return {
          success: true,
          data: {
            name: property.name,
            value: property.value,
            hidden: hiddenBool,
            createdAt: now,
          },
        };
      } catch (error) {
        logger.error("Failed to set role property", {
          error,
          roleId,
          property,
        });
        return { success: false, error: error as Error };
      }
    },

    async deleteProperty(
      inputOrgId: string,
      roleId: string,
      name: string,
    ): Promise<Result<boolean>> {
      try {
        const rowCount = await executeDelete(
          db,
          schema,
          (q, p: { roleId: string; orgId: string; name: string }) =>
            q
              .deleteFrom("role_property")
              .where(
                (rp) =>
                  rp.parent_id === p.roleId &&
                  rp.org_id === p.orgId &&
                  rp.name === p.name,
              ),
          { roleId, orgId: inputOrgId, name },
        );
        return { success: true, data: rowCount > 0 };
      } catch (error) {
        logger.error("Failed to delete role property", { error, roleId, name });
        return { success: false, error: error as Error };
      }
    },
  };
}
