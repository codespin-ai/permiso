/**
 * PostgreSQL Role Repository
 */

import { createLogger } from "@codespin/permiso-logger";
import { sql, type Database } from "@codespin/permiso-db";
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
import type { RoleDbRow, PropertyDbRow, UserRoleDbRow } from "../../types.js";

const logger = createLogger("permiso-server:repos:postgres:role");

function mapRoleFromDb(row: RoleDbRow): Role {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPropertyFromDb(row: PropertyDbRow): Property {
  return {
    name: row.name,
    value: row.value,
    hidden: row.hidden,
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
        const role = await db.tx(async (t) => {
          const now = Date.now();
          const params = {
            id: input.id,
            org_id: inputOrgId,
            name: input.name,
            description: input.description ?? null,
            created_at: now,
            updated_at: now,
          };

          const roleRow = await t.one<RoleDbRow>(
            `${sql.insert("role", params)} RETURNING *`,
            params,
          );

          if (input.properties && input.properties.length > 0) {
            for (const prop of input.properties) {
              const propParams = {
                parent_id: input.id,
                org_id: inputOrgId,
                name: prop.name,
                value:
                  prop.value === undefined ? null : JSON.stringify(prop.value),
                hidden: prop.hidden ?? false,
                created_at: now,
              };
              await t.none(sql.insert("role_property", propParams), propParams);
            }
          }

          return roleRow;
        });

        return { success: true, data: mapRoleFromDb(role) };
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
        const row = await db.oneOrNone<RoleDbRow>(
          `SELECT * FROM role WHERE id = $(roleId) AND org_id = $(orgId)`,
          { roleId, orgId: inputOrgId },
        );
        return { success: true, data: row ? mapRoleFromDb(row) : null };
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
        let whereClause = "WHERE org_id = $(orgId)";
        const params: Record<string, unknown> = { orgId: inputOrgId };

        if (filter?.name) {
          whereClause += " AND name ILIKE $(name)";
          params.name = `%${filter.name}%`;
        }

        const countResult = await db.one<{ count: string }>(
          `SELECT COUNT(*) as count FROM role ${whereClause}`,
          params,
        );
        const totalCount = parseInt(countResult.count, 10);

        let query = `SELECT * FROM role ${whereClause} ORDER BY created_at DESC`;
        if (pagination?.first) {
          query += ` LIMIT $(limit)`;
          params.limit = pagination.first;
        }

        const rows = await db.manyOrNone<RoleDbRow>(query, params);

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
        const updateParams: Record<string, unknown> = { updated_at: now };

        if (input.name !== undefined) {
          updateParams.name = input.name;
        }
        if (input.description !== undefined) {
          updateParams.description = input.description;
        }

        const row = await db.one<RoleDbRow>(
          `${sql.update("role", updateParams)} WHERE id = $(roleId) AND org_id = $(orgId) RETURNING *`,
          { ...updateParams, roleId, orgId: inputOrgId },
        );

        return { success: true, data: mapRoleFromDb(row) };
      } catch (error) {
        logger.error("Failed to update role", { error, roleId });
        return { success: false, error: error as Error };
      }
    },

    async delete(inputOrgId: string, roleId: string): Promise<Result<boolean>> {
      try {
        await db.tx(async (t) => {
          await t.none(
            `DELETE FROM role_property WHERE parent_id = $(roleId) AND org_id = $(orgId)`,
            { roleId, orgId: inputOrgId },
          );
          await t.none(
            `DELETE FROM role_permission WHERE role_id = $(roleId) AND org_id = $(orgId)`,
            { roleId, orgId: inputOrgId },
          );
          await t.none(
            `DELETE FROM user_role WHERE role_id = $(roleId) AND org_id = $(orgId)`,
            { roleId, orgId: inputOrgId },
          );
          await t.none(
            `DELETE FROM role WHERE id = $(roleId) AND org_id = $(orgId)`,
            { roleId, orgId: inputOrgId },
          );
        });
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
        const rows = await db.manyOrNone<UserRoleDbRow>(
          `SELECT * FROM user_role WHERE role_id = $(roleId) AND org_id = $(orgId)`,
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
        const rows = await db.manyOrNone<PropertyDbRow>(
          `SELECT * FROM role_property WHERE parent_id = $(roleId) AND org_id = $(orgId)`,
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
        const row = await db.oneOrNone<PropertyDbRow>(
          `SELECT * FROM role_property WHERE parent_id = $(roleId) AND org_id = $(orgId) AND name = $(name)`,
          { roleId, orgId: inputOrgId, name },
        );
        return { success: true, data: row ? mapPropertyFromDb(row) : null };
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
        const params = {
          parent_id: roleId,
          org_id: inputOrgId,
          name: property.name,
          value:
            property.value === undefined
              ? null
              : JSON.stringify(property.value),
          hidden: property.hidden ?? false,
          created_at: now,
        };

        await db.none(
          `INSERT INTO role_property (parent_id, org_id, name, value, hidden, created_at)
           VALUES ($(parent_id), $(org_id), $(name), $(value), $(hidden), $(created_at))
           ON CONFLICT (parent_id, org_id, name)
           DO UPDATE SET value = $(value), hidden = $(hidden)`,
          params,
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
        await db.none(
          `DELETE FROM role_property WHERE parent_id = $(roleId) AND org_id = $(orgId) AND name = $(name)`,
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
