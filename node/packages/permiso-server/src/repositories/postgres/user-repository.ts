/**
 * PostgreSQL User Repository
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
import { schema, type UserRow } from "./tinqer-schema.js";
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

const logger = createLogger("permiso-server:repos:postgres:user");

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

        // Insert user and get back the row
        const userRows = await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              id: string;
              org_id: string;
              identity_provider: string;
              identity_provider_user_id: string;
              created_at: number;
              updated_at: number;
            },
          ) =>
            q
              .insertInto("user")
              .values({
                id: p.id,
                org_id: p.org_id,
                identity_provider: p.identity_provider,
                identity_provider_user_id: p.identity_provider_user_id,
                created_at: p.created_at,
                updated_at: p.updated_at,
              })
              .returning((u) => u),
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

        // Handle role assignments if provided
        if (input.roleIds && input.roleIds.length > 0) {
          for (const roleId of input.roleIds) {
            await executeInsert(
              db,
              schema,
              (
                q,
                p: {
                  user_id: string;
                  role_id: string;
                  org_id: string;
                  created_at: number;
                },
              ) =>
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

        if (!userRows[0]) {
          return {
            success: false,
            error: new Error("User not found after creation"),
          };
        }

        return { success: true, data: mapUserFromDb(userRows[0]) };
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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .from("user")
              .where((u) => u.id === p.userId && u.org_id === p.orgId),
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
        const rows = await executeSelect(
          db,
          schema,
          (
            q,
            p: {
              orgId: string;
              identityProvider: string;
              identityProviderUserId: string;
            },
          ) =>
            q
              .from("user")
              .where(
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
        let totalCount: number;
        let rows: UserRow[];

        if (filter?.identityProvider) {
          // Filtered queries - with identityProvider filter
          totalCount = (await executeSelect(
            db,
            schema,
            (q, p: { orgId: string; identityProvider: string }) =>
              q
                .from("user")
                .where(
                  (u) =>
                    u.org_id === p.orgId &&
                    u.identity_provider === p.identityProvider,
                )
                .count(),
            { orgId: inputOrgId, identityProvider: filter.identityProvider },
          )) as unknown as number;

          rows = await executeSelect(
            db,
            schema,
            (
              q,
              p: {
                orgId: string;
                identityProvider: string;
                first: number;
                offset: number;
              },
            ) =>
              q
                .from("user")
                .where(
                  (u) =>
                    u.org_id === p.orgId &&
                    u.identity_provider === p.identityProvider,
                )
                .orderBy((u) => u.id)
                .skip(p.offset)
                .take(p.first),
            {
              orgId: inputOrgId,
              identityProvider: filter.identityProvider,
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
                .from("user")
                .where((u) => u.org_id === p.orgId)
                .count(),
            { orgId: inputOrgId },
          )) as unknown as number;

          rows = await executeSelect(
            db,
            schema,
            (q, p: { orgId: string; first: number; offset: number }) =>
              q
                .from("user")
                .where((u) => u.org_id === p.orgId)
                .orderBy((u) => u.id)
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

        const rows = await executeUpdate(
          db,
          schema,
          (
            q,
            p: {
              userId: string;
              orgId: string;
              updated_at: number;
              identity_provider: string | undefined;
              identity_provider_user_id: string | undefined;
            },
          ) =>
            q
              .update("user")
              .set({
                updated_at: p.updated_at,
                identity_provider: p.identity_provider,
                identity_provider_user_id: p.identity_provider_user_id,
              })
              .where((u) => u.id === p.userId && u.org_id === p.orgId)
              .returning((u) => u),
          {
            userId,
            orgId: inputOrgId,
            updated_at: now,
            identity_provider: input.identityProvider,
            identity_provider_user_id: input.identityProviderUserId,
          },
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
        await executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .deleteFrom("user_property")
              .where(
                (up) => up.parent_id === p.userId && up.org_id === p.orgId,
              ),
          { userId, orgId: inputOrgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .deleteFrom("user_role")
              .where((ur) => ur.user_id === p.userId && ur.org_id === p.orgId),
          { userId, orgId: inputOrgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .deleteFrom("user_permission")
              .where((up) => up.user_id === p.userId && up.org_id === p.orgId),
          { userId, orgId: inputOrgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .deleteFrom("user")
              .where((u) => u.id === p.userId && u.org_id === p.orgId),
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
        await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              userId: string;
              roleId: string;
              orgId: string;
              createdAt: number;
            },
          ) =>
            q
              .insertInto("user_role")
              .values({
                user_id: p.userId,
                role_id: p.roleId,
                org_id: p.orgId,
                created_at: p.createdAt,
              })
              .onConflict(
                (ur) => ur.user_id,
                (ur) => ur.role_id,
                (ur) => ur.org_id,
              )
              .doNothing(),
          { userId, roleId, orgId: inputOrgId, createdAt: now },
        );

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
        await executeDelete(
          db,
          schema,
          (q, p: { userId: string; roleId: string; orgId: string }) =>
            q
              .deleteFrom("user_role")
              .where(
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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .from("user_role")
              .where((ur) => ur.user_id === p.userId && ur.org_id === p.orgId),
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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .from("user_property")
              .where(
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
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string; name: string }) =>
            q
              .from("user_property")
              .where(
                (up) =>
                  up.parent_id === p.userId &&
                  up.org_id === p.orgId &&
                  up.name === p.name,
              ),
          { userId, orgId: inputOrgId, name },
        );
        return {
          success: true,
          data: rows[0] ? mapPropertyFromDb(rows[0]) : null,
        };
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
              .insertInto("user_property")
              .values({
                parent_id: p.parentId,
                org_id: p.orgId,
                name: p.name,
                value: p.value,
                hidden: p.hidden,
                created_at: p.createdAt,
              })
              .onConflict(
                (up) => up.parent_id,
                (up) => up.org_id,
                (up) => up.name,
              )
              .doUpdateSet({
                value: p.value,
                hidden: p.hidden,
              }),
          {
            parentId: userId,
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
        const rowCount = await executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string; name: string }) =>
            q
              .deleteFrom("user_property")
              .where(
                (up) =>
                  up.parent_id === p.userId &&
                  up.org_id === p.orgId &&
                  up.name === p.name,
              ),
          { userId, orgId: inputOrgId, name },
        );
        return { success: true, data: rowCount > 0 };
      } catch (error) {
        logger.error("Failed to delete user property", { error, userId, name });
        return { success: false, error: error as Error };
      }
    },
  };
}
