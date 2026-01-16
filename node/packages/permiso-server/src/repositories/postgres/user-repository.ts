/**
 * PostgreSQL User Repository
 *
 * Uses RLS for tenant isolation. The org_id is set via SET LOCAL at the start
 * of each transaction by the RLS database wrapper.
 */

import { createLogger } from "@codespin/permiso-logger";
import { sql, type Database } from "@codespin/permiso-db";
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
import type { UserDbRow, PropertyDbRow, UserRoleDbRow } from "../../types.js";

const logger = createLogger("permiso-server:repos:postgres:user");

function mapUserFromDb(row: UserDbRow): User {
  return {
    id: row.id,
    orgId: row.org_id,
    identityProvider: row.identity_provider,
    identityProviderUserId: row.identity_provider_user_id,
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

export function createUserRepository(
  db: Database,
  orgId: string,
): IUserRepository {
  return {
    async create(
      inputOrgId: string,
      input: CreateUserInput,
    ): Promise<Result<User>> {
      try {
        const user = await db.tx(async (t) => {
          const now = Date.now();
          const params = {
            id: input.id,
            org_id: inputOrgId,
            identity_provider: input.identityProvider,
            identity_provider_user_id: input.identityProviderUserId,
            created_at: now,
            updated_at: now,
          };

          const userRow = await t.one<UserDbRow>(
            `${sql.insert('"user"', params)} RETURNING *`,
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
              await t.none(sql.insert("user_property", propParams), propParams);
            }
          }

          if (input.roleIds && input.roleIds.length > 0) {
            for (const roleId of input.roleIds) {
              const roleParams = {
                user_id: input.id,
                role_id: roleId,
                org_id: inputOrgId,
                created_at: now,
              };
              await t.none(sql.insert("user_role", roleParams), roleParams);
            }
          }

          return userRow;
        });

        return { success: true, data: mapUserFromDb(user) };
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
        const row = await db.oneOrNone<UserDbRow>(
          `SELECT * FROM "user" WHERE id = $(userId) AND org_id = $(orgId)`,
          { userId, orgId: inputOrgId },
        );
        return { success: true, data: row ? mapUserFromDb(row) : null };
      } catch (error) {
        logger.error("Failed to get user by id", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async getByIdentity(
      inputOrgId: string,
      identityProvider: string,
      identityProviderUserId: string,
    ): Promise<Result<User | null>> {
      try {
        const row = await db.oneOrNone<UserDbRow>(
          `SELECT * FROM "user"
           WHERE org_id = $(orgId)
           AND identity_provider = $(identityProvider)
           AND identity_provider_user_id = $(identityProviderUserId)`,
          { orgId: inputOrgId, identityProvider, identityProviderUserId },
        );
        return { success: true, data: row ? mapUserFromDb(row) : null };
      } catch (error) {
        logger.error("Failed to get user by identity", {
          error,
          identityProvider,
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
        let whereClause = "WHERE org_id = $(orgId)";
        const params: Record<string, unknown> = { orgId: inputOrgId };

        if (filter?.identityProvider) {
          whereClause += " AND identity_provider = $(identityProvider)";
          params.identityProvider = filter.identityProvider;
        }

        // Get total count
        const countResult = await db.one<{ count: string }>(
          `SELECT COUNT(*) as count FROM "user" ${whereClause}`,
          params,
        );
        const totalCount = parseInt(countResult.count, 10);

        // Get nodes with pagination
        let query = `SELECT * FROM "user" ${whereClause} ORDER BY created_at DESC`;
        if (pagination?.first) {
          query += ` LIMIT $(limit)`;
          params.limit = pagination.first;
        }

        const rows = await db.manyOrNone<UserDbRow>(query, params);

        return {
          success: true,
          data: {
            nodes: rows.map(mapUserFromDb),
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
        const updateParams: Record<string, unknown> = { updated_at: now };

        if (input.identityProvider !== undefined) {
          updateParams.identity_provider = input.identityProvider;
        }
        if (input.identityProviderUserId !== undefined) {
          updateParams.identity_provider_user_id = input.identityProviderUserId;
        }

        const row = await db.one<UserDbRow>(
          `${sql.update('"user"', updateParams)} WHERE id = $(userId) AND org_id = $(orgId) RETURNING *`,
          { ...updateParams, userId, orgId: inputOrgId },
        );

        return { success: true, data: mapUserFromDb(row) };
      } catch (error) {
        logger.error("Failed to update user", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async delete(inputOrgId: string, userId: string): Promise<Result<boolean>> {
      try {
        await db.tx(async (t) => {
          // Delete related data first
          await t.none(
            `DELETE FROM user_property WHERE parent_id = $(userId) AND org_id = $(orgId)`,
            { userId, orgId: inputOrgId },
          );
          await t.none(
            `DELETE FROM user_role WHERE user_id = $(userId) AND org_id = $(orgId)`,
            { userId, orgId: inputOrgId },
          );
          await t.none(
            `DELETE FROM user_permission WHERE user_id = $(userId) AND org_id = $(orgId)`,
            { userId, orgId: inputOrgId },
          );
          await t.none(
            `DELETE FROM "user" WHERE id = $(userId) AND org_id = $(orgId)`,
            { userId, orgId: inputOrgId },
          );
        });
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
        const params = {
          user_id: userId,
          role_id: roleId,
          org_id: inputOrgId,
          created_at: Date.now(),
        };
        await db.none(sql.insert("user_role", params), params);
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
        await db.none(
          `DELETE FROM user_role WHERE user_id = $(userId) AND role_id = $(roleId) AND org_id = $(orgId)`,
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
        const rows = await db.manyOrNone<UserRoleDbRow>(
          `SELECT * FROM user_role WHERE user_id = $(userId) AND org_id = $(orgId)`,
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
        const rows = await db.manyOrNone<PropertyDbRow>(
          `SELECT * FROM user_property WHERE parent_id = $(userId) AND org_id = $(orgId)`,
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
        const row = await db.oneOrNone<PropertyDbRow>(
          `SELECT * FROM user_property WHERE parent_id = $(userId) AND org_id = $(orgId) AND name = $(name)`,
          { userId, orgId: inputOrgId, name },
        );
        return { success: true, data: row ? mapPropertyFromDb(row) : null };
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
        const params = {
          parent_id: userId,
          org_id: inputOrgId,
          name: property.name,
          value:
            property.value === undefined
              ? null
              : JSON.stringify(property.value),
          hidden: property.hidden ?? false,
          created_at: now,
        };

        // Upsert
        await db.none(
          `INSERT INTO user_property (parent_id, org_id, name, value, hidden, created_at)
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
        logger.error("Failed to set user property", {
          error,
          userId,
          property,
        });
        return { success: false, error: error as Error };
      }
    },

    async deleteProperty(
      inputOrgId: string,
      userId: string,
      name: string,
    ): Promise<Result<boolean>> {
      try {
        await db.none(
          `DELETE FROM user_property WHERE parent_id = $(userId) AND org_id = $(orgId) AND name = $(name)`,
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
