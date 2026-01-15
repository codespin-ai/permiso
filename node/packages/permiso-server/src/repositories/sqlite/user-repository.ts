/**
 * SQLite User Repository
 *
 * Uses Tinqer for type-safe queries with app-level tenant filtering.
 */

import { createLogger } from "@codespin/permiso-logger";
import {
  executeSelect,
  executeInsert,
  executeUpdate,
  executeDelete,
} from "@tinqerjs/better-sqlite3-adapter";
import type { Database } from "better-sqlite3";
import { schema } from "../tinqer-schema.js";
import type {
  IUserRepository,
  User,
  UserFilter,
  CreateUserInput,
  UpdateUserInput,
  Property,
  PropertyInput,
  PaginationInput,
  Connection,
  Result,
} from "../interfaces/index.js";

const logger = createLogger("permiso-server:repos:sqlite:user");

function mapUserFromDb(row: {
  id: string;
  org_id: string;
  identity_provider: string;
  identity_provider_user_id: string;
  created_at: number;
  updated_at: number;
}): User {
  return {
    id: row.id,
    orgId: row.org_id,
    identityProvider: row.identity_provider,
    identityProviderUserId: row.identity_provider_user_id,
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

export function createUserRepository(
  db: Database,
  _orgId: string,
): IUserRepository {
  return {
    async create(
      inputOrgId: string,
      input: CreateUserInput,
    ): Promise<Result<User>> {
      try {
        const now = Date.now();

        executeInsert(
          db,
          schema,
          (q, p: {
            id: string;
            org_id: string;
            identity_provider: string;
            identity_provider_user_id: string;
            created_at: number;
            updated_at: number;
          }) =>
            q.insertInto("user").values({
              id: p.id,
              org_id: p.org_id,
              identity_provider: p.identity_provider,
              identity_provider_user_id: p.identity_provider_user_id,
              created_at: p.created_at,
              updated_at: p.updated_at,
            }),
          {
            id: input.id,
            org_id: inputOrgId,
            identity_provider: input.identityProvider,
            identity_provider_user_id: input.identityProviderUserId,
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
                q.insertInto("user_property").values({
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

        // Handle role assignments if provided
        if (input.roleIds && input.roleIds.length > 0) {
          for (const roleId of input.roleIds) {
            executeInsert(
              db,
              schema,
              (q, p: {
                user_id: string;
                role_id: string;
                org_id: string;
                created_at: number;
              }) =>
                q.insertInto("user_role").values({
                  user_id: p.user_id,
                  role_id: p.role_id,
                  org_id: p.org_id,
                  created_at: p.created_at,
                }),
              {
                user_id: input.id,
                role_id: roleId,
                org_id: inputOrgId,
                created_at: now,
              },
            );
          }
        }

        // Get the created user
        const rows = executeSelect(
          db,
          schema,
          (q, p: { id: string; org_id: string }) =>
            q.from("user").where((u) => u.id === p.id && u.org_id === p.org_id),
          { id: input.id, org_id: inputOrgId },
        );

        if (!rows[0]) {
          return { success: false, error: new Error("User not found after creation") };
        }

        return { success: true, data: mapUserFromDb(rows[0]) };
      } catch (error) {
        logger.error("Failed to create user", { error, input });
        return { success: false, error: error as Error };
      }
    },

    async getById(
      inputOrgId: string,
      userId: string,
    ): Promise<Result<User | null>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user").where((u) => u.id === p.userId && u.org_id === p.orgId),
          { userId, orgId: inputOrgId },
        );
        return { success: true, data: rows[0] ? mapUserFromDb(rows[0]) : null };
      } catch (error) {
        logger.error("Failed to get user", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async getByIdentity(
      inputOrgId: string,
      identityProvider: string,
      identityProviderUserId: string,
    ): Promise<Result<User | null>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { orgId: string; identityProvider: string; identityProviderUserId: string }) =>
            q.from("user").where(
              (u) =>
                u.org_id === p.orgId &&
                u.identity_provider === p.identityProvider &&
                u.identity_provider_user_id === p.identityProviderUserId,
            ),
          { orgId: inputOrgId, identityProvider, identityProviderUserId },
        );
        return { success: true, data: rows[0] ? mapUserFromDb(rows[0]) : null };
      } catch (error) {
        logger.error("Failed to get user by identity", {
          error,
          identityProvider,
          identityProviderUserId,
        });
        return { success: false, error: error as Error };
      }
    },

    async list(
      inputOrgId: string,
      filter?: UserFilter,
      pagination?: PaginationInput,
    ): Promise<Result<Connection<User>>> {
      try {
        // Count query
        const countRows = executeSelect(
          db,
          schema,
          (q, p: { orgId: string; identityProvider?: string }) => {
            let query = q.from("user").where((u) => u.org_id === p.orgId);
            if (p.identityProvider) {
              query = query.where((u) => u.identity_provider === p.identityProvider);
            }
            return query.select(() => ({ count: 1 }));
          },
          { orgId: inputOrgId, identityProvider: filter?.identityProvider },
        );
        const totalCount = countRows.length;

        // Main query - Tinqer doesn't support orderBy/limit directly in all cases,
        // so we use raw SQL for complex queries
        const stmt = db.prepare(
          `SELECT * FROM "user" WHERE org_id = @orgId${
            filter?.identityProvider ? " AND identity_provider = @identityProvider" : ""
          } ORDER BY created_at DESC${pagination?.first ? " LIMIT @limit" : ""}`,
        );
        const rows = stmt.all({
          orgId: inputOrgId,
          identityProvider: filter?.identityProvider,
          limit: pagination?.first,
        }) as Array<{
          id: string;
          org_id: string;
          identity_provider: string;
          identity_provider_user_id: string;
          created_at: number;
          updated_at: number;
        }>;

        return {
          success: true,
          data: {
            nodes: rows.map(mapUserFromDb),
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
        logger.error("Failed to list users", { error });
        return { success: false, error: error as Error };
      }
    },

    async listByOrg(
      inputOrgId: string,
      pagination?: PaginationInput,
    ): Promise<Result<Connection<User>>> {
      return this.list(inputOrgId, undefined, pagination);
    },

    async update(
      inputOrgId: string,
      userId: string,
      input: UpdateUserInput,
    ): Promise<Result<User>> {
      try {
        const now = Date.now();

        // Build update - Tinqer update requires all fields, so we do partial update with raw SQL
        const updates: string[] = ["updated_at = @updated_at"];
        const params: Record<string, unknown> = { userId, orgId: inputOrgId, updated_at: now };

        if (input.identityProvider !== undefined) {
          updates.push("identity_provider = @identity_provider");
          params.identity_provider = input.identityProvider;
        }
        if (input.identityProviderUserId !== undefined) {
          updates.push("identity_provider_user_id = @identity_provider_user_id");
          params.identity_provider_user_id = input.identityProviderUserId;
        }

        const stmt = db.prepare(
          `UPDATE "user" SET ${updates.join(", ")} WHERE id = @userId AND org_id = @orgId`,
        );
        stmt.run(params);

        // Get updated user
        const rows = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user").where((u) => u.id === p.userId && u.org_id === p.orgId),
          { userId, orgId: inputOrgId },
        );

        if (!rows[0]) {
          return { success: false, error: new Error("User not found") };
        }

        return { success: true, data: mapUserFromDb(rows[0]) };
      } catch (error) {
        logger.error("Failed to update user", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async delete(inputOrgId: string, userId: string): Promise<Result<boolean>> {
      try {
        // Delete related data first
        executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.deleteFrom("user_property").where(
              (up) => up.parent_id === p.userId && up.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );

        executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.deleteFrom("user_role").where(
              (ur) => ur.user_id === p.userId && ur.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );

        executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.deleteFrom("user_permission").where(
              (up) => up.user_id === p.userId && up.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );

        executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.deleteFrom("user").where((u) => u.id === p.userId && u.org_id === p.orgId),
          { userId, orgId: inputOrgId },
        );

        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to delete user", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async assignRole(
      inputOrgId: string,
      userId: string,
      roleId: string,
    ): Promise<Result<void>> {
      try {
        const now = Date.now();
        // Use INSERT OR IGNORE for SQLite
        const stmt = db.prepare(
          `INSERT OR IGNORE INTO user_role (user_id, role_id, org_id, created_at)
           VALUES (@userId, @roleId, @orgId, @createdAt)`,
        );
        stmt.run({ userId, roleId, orgId: inputOrgId, createdAt: now });
        return { success: true, data: undefined };
      } catch (error) {
        logger.error("Failed to assign role", { error, userId, roleId });
        return { success: false, error: error as Error };
      }
    },

    async unassignRole(
      inputOrgId: string,
      userId: string,
      roleId: string,
    ): Promise<Result<void>> {
      try {
        executeDelete(
          db,
          schema,
          (q, p: { userId: string; roleId: string; orgId: string }) =>
            q.deleteFrom("user_role").where(
              (ur) =>
                ur.user_id === p.userId &&
                ur.role_id === p.roleId &&
                ur.org_id === p.orgId,
            ),
          { userId, roleId, orgId: inputOrgId },
        );
        return { success: true, data: undefined };
      } catch (error) {
        logger.error("Failed to unassign role", { error, userId, roleId });
        return { success: false, error: error as Error };
      }
    },

    async getRoleIds(
      inputOrgId: string,
      userId: string,
    ): Promise<Result<string[]>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user_role").where(
              (ur) => ur.user_id === p.userId && ur.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );
        return { success: true, data: rows.map((r) => r.role_id) };
      } catch (error) {
        logger.error("Failed to get user roles", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async getProperties(
      inputOrgId: string,
      userId: string,
    ): Promise<Result<Property[]>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user_property").where(
              (up) => up.parent_id === p.userId && up.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );
        return { success: true, data: rows.map(mapPropertyFromDb) };
      } catch (error) {
        logger.error("Failed to get user properties", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async getProperty(
      inputOrgId: string,
      userId: string,
      name: string,
    ): Promise<Result<Property | null>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string; name: string }) =>
            q.from("user_property").where(
              (up) =>
                up.parent_id === p.userId &&
                up.org_id === p.orgId &&
                up.name === p.name,
            ),
          { userId, orgId: inputOrgId, name },
        );
        return { success: true, data: rows[0] ? mapPropertyFromDb(rows[0]) : null };
      } catch (error) {
        logger.error("Failed to get user property", { error, userId, name });
        return { success: false, error: error as Error };
      }
    },

    async setProperty(
      inputOrgId: string,
      userId: string,
      property: PropertyInput,
    ): Promise<Result<Property>> {
      try {
        const now = Date.now();
        // Use INSERT OR REPLACE for upsert in SQLite
        const stmt = db.prepare(
          `INSERT INTO user_property (parent_id, org_id, name, value, hidden, created_at)
           VALUES (@parent_id, @org_id, @name, @value, @hidden, @created_at)
           ON CONFLICT (parent_id, org_id, name)
           DO UPDATE SET value = @value, hidden = @hidden`,
        );
        stmt.run({
          parent_id: userId,
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
        logger.error("Failed to set user property", { error, userId, property });
        return { success: false, error: error as Error };
      }
    },

    async deleteProperty(
      inputOrgId: string,
      userId: string,
      name: string,
    ): Promise<Result<boolean>> {
      try {
        executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string; name: string }) =>
            q.deleteFrom("user_property").where(
              (up) =>
                up.parent_id === p.userId &&
                up.org_id === p.orgId &&
                up.name === p.name,
            ),
          { userId, orgId: inputOrgId, name },
        );
        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to delete user property", { error, userId, name });
        return { success: false, error: error as Error };
      }
    },
  };
}
