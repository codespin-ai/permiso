/**
 * PostgreSQL Permission Repository
 *
 * Uses Tinqer for type-safe queries where possible.
 * Complex wildcard and EXISTS queries use raw SQL.
 */

import { createLogger } from "@codespin/permiso-logger";
import {
  executeSelect,
  executeInsert,
  executeDelete,
} from "@tinqerjs/pg-promise-adapter";
import type { Database } from "@codespin/permiso-db";
import { schema } from "./tinqer-schema.js";
import type {
  IPermissionRepository,
  UserPermission,
  RolePermission,
  EffectivePermission,
  GrantPermissionInput,
  Result,
} from "../interfaces/index.js";
import type {
  UserPermissionDbRow,
  RolePermissionDbRow,
  UserRoleDbRow,
} from "../../types.js";

const logger = createLogger("permiso-server:repos:postgres:permission");

function mapUserPermissionFromDb(row: {
  user_id: string;
  org_id: string;
  resource_id: string;
  action: string;
  created_at: number;
}): UserPermission {
  return {
    userId: row.user_id,
    orgId: row.org_id,
    resourceId: row.resource_id,
    action: row.action,
    createdAt: row.created_at,
  };
}

function mapRolePermissionFromDb(row: {
  role_id: string;
  org_id: string;
  resource_id: string;
  action: string;
  created_at: number;
}): RolePermission {
  return {
    roleId: row.role_id,
    orgId: row.org_id,
    resourceId: row.resource_id,
    action: row.action,
    createdAt: row.created_at,
  };
}

export function createPermissionRepository(
  db: Database,
  _orgId: string,
): IPermissionRepository {
  return {
    async grantUserPermission(
      inputOrgId: string,
      userId: string,
      input: GrantPermissionInput,
    ): Promise<Result<UserPermission>> {
      try {
        const now = Date.now();

        await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              userId: string;
              orgId: string;
              resourceId: string;
              action: string;
              createdAt: number;
            },
          ) =>
            q
              .insertInto("user_permission")
              .values({
                user_id: p.userId,
                org_id: p.orgId,
                resource_id: p.resourceId,
                action: p.action,
                created_at: p.createdAt,
              })
              .onConflict(
                (up) => up.user_id,
                (up) => up.org_id,
                (up) => up.resource_id,
                (up) => up.action,
              )
              .doNothing(),
          {
            userId,
            orgId: inputOrgId,
            resourceId: input.resourceId,
            action: input.action,
            createdAt: now,
          },
        );

        return {
          success: true,
          data: {
            userId,
            orgId: inputOrgId,
            resourceId: input.resourceId,
            action: input.action,
            createdAt: now,
          },
        };
      } catch (error) {
        logger.error("Failed to grant user permission", {
          error,
          userId,
          input,
        });
        return { success: false, error: error as Error };
      }
    },

    async revokeUserPermission(
      inputOrgId: string,
      userId: string,
      resourceId: string,
      action: string,
    ): Promise<Result<boolean>> {
      try {
        const rowCount = await executeDelete(
          db,
          schema,
          (
            q,
            p: {
              userId: string;
              orgId: string;
              resourceId: string;
              action: string;
            },
          ) =>
            q
              .deleteFrom("user_permission")
              .where(
                (up) =>
                  up.user_id === p.userId &&
                  up.org_id === p.orgId &&
                  up.resource_id === p.resourceId &&
                  up.action === p.action,
              ),
          { userId, orgId: inputOrgId, resourceId, action },
        );
        return { success: true, data: rowCount > 0 };
      } catch (error) {
        logger.error("Failed to revoke user permission", {
          error,
          userId,
          resourceId,
          action,
        });
        return { success: false, error: error as Error };
      }
    },

    async getUserPermissions(
      inputOrgId: string,
      userId: string,
    ): Promise<Result<UserPermission[]>> {
      try {
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .from("user_permission")
              .where((up) => up.user_id === p.userId && up.org_id === p.orgId),
          { userId, orgId: inputOrgId },
        );
        return { success: true, data: rows.map(mapUserPermissionFromDb) };
      } catch (error) {
        logger.error("Failed to get user permissions", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async grantRolePermission(
      inputOrgId: string,
      roleId: string,
      input: GrantPermissionInput,
    ): Promise<Result<RolePermission>> {
      try {
        const now = Date.now();

        await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              roleId: string;
              orgId: string;
              resourceId: string;
              action: string;
              createdAt: number;
            },
          ) =>
            q
              .insertInto("role_permission")
              .values({
                role_id: p.roleId,
                org_id: p.orgId,
                resource_id: p.resourceId,
                action: p.action,
                created_at: p.createdAt,
              })
              .onConflict(
                (rp) => rp.role_id,
                (rp) => rp.org_id,
                (rp) => rp.resource_id,
                (rp) => rp.action,
              )
              .doNothing(),
          {
            roleId,
            orgId: inputOrgId,
            resourceId: input.resourceId,
            action: input.action,
            createdAt: now,
          },
        );

        return {
          success: true,
          data: {
            roleId,
            orgId: inputOrgId,
            resourceId: input.resourceId,
            action: input.action,
            createdAt: now,
          },
        };
      } catch (error) {
        logger.error("Failed to grant role permission", {
          error,
          roleId,
          input,
        });
        return { success: false, error: error as Error };
      }
    },

    async revokeRolePermission(
      inputOrgId: string,
      roleId: string,
      resourceId: string,
      action: string,
    ): Promise<Result<boolean>> {
      try {
        const rowCount = await executeDelete(
          db,
          schema,
          (
            q,
            p: {
              roleId: string;
              orgId: string;
              resourceId: string;
              action: string;
            },
          ) =>
            q
              .deleteFrom("role_permission")
              .where(
                (rp) =>
                  rp.role_id === p.roleId &&
                  rp.org_id === p.orgId &&
                  rp.resource_id === p.resourceId &&
                  rp.action === p.action,
              ),
          { roleId, orgId: inputOrgId, resourceId, action },
        );
        return { success: true, data: rowCount > 0 };
      } catch (error) {
        logger.error("Failed to revoke role permission", {
          error,
          roleId,
          resourceId,
          action,
        });
        return { success: false, error: error as Error };
      }
    },

    async getRolePermissions(
      inputOrgId: string,
      roleId: string,
    ): Promise<Result<RolePermission[]>> {
      try {
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q
              .from("role_permission")
              .where((rp) => rp.role_id === p.roleId && rp.org_id === p.orgId),
          { roleId, orgId: inputOrgId },
        );
        return { success: true, data: rows.map(mapRolePermissionFromDb) };
      } catch (error) {
        logger.error("Failed to get role permissions", { error, roleId });
        return { success: false, error: error as Error };
      }
    },

    async getPermissionsByResource(
      inputOrgId: string,
      resourceId: string,
    ): Promise<
      Result<{
        userPermissions: UserPermission[];
        rolePermissions: RolePermission[];
      }>
    > {
      try {
        const [userRows, roleRows] = await Promise.all([
          executeSelect(
            db,
            schema,
            (q, p: { resourceId: string; orgId: string }) =>
              q
                .from("user_permission")
                .where(
                  (up) =>
                    up.resource_id === p.resourceId && up.org_id === p.orgId,
                ),
            { resourceId, orgId: inputOrgId },
          ),
          executeSelect(
            db,
            schema,
            (q, p: { resourceId: string; orgId: string }) =>
              q
                .from("role_permission")
                .where(
                  (rp) =>
                    rp.resource_id === p.resourceId && rp.org_id === p.orgId,
                ),
            { resourceId, orgId: inputOrgId },
          ),
        ]);

        return {
          success: true,
          data: {
            userPermissions: userRows.map(mapUserPermissionFromDb),
            rolePermissions: roleRows.map(mapRolePermissionFromDb),
          },
        };
      } catch (error) {
        logger.error("Failed to get permissions by resource", {
          error,
          resourceId,
        });
        return { success: false, error: error as Error };
      }
    },

    async getEffectivePermissions(
      inputOrgId: string,
      userId: string,
      resourceId?: string,
      action?: string,
    ): Promise<Result<EffectivePermission[]>> {
      try {
        // Get user's role IDs using Tinqer
        const userRoles = await executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .from("user_role")
              .where((ur) => ur.user_id === p.userId && ur.org_id === p.orgId),
          { userId, orgId: inputOrgId },
        );
        const roleIds = userRoles.map((r) => r.role_id);

        const permissions: EffectivePermission[] = [];

        // Build filter conditions - complex wildcard queries need raw SQL
        let resourceFilter = "";
        let actionFilter = "";
        const params: Record<string, unknown> = {
          userId,
          orgId: inputOrgId,
          roleIds,
        };

        if (resourceId) {
          resourceFilter = `AND (
            resource_id = $(resourceId)
            OR $(resourceId) LIKE REPLACE(resource_id, '*', '') || '%'
          )`;
          params.resourceId = resourceId;
        }
        if (action) {
          actionFilter = `AND (action = $(action) OR action = '*')`;
          params.action = action;
        }

        // Get direct user permissions
        const userPerms = await db.manyOrNone<UserPermissionDbRow>(
          `SELECT * FROM user_permission
           WHERE user_id = $(userId) AND org_id = $(orgId)
           ${resourceFilter} ${actionFilter}`,
          params,
        );

        for (const perm of userPerms) {
          permissions.push({
            resourceId: perm.resource_id,
            action: perm.action,
            source: "user",
            sourceId: userId,
            createdAt: perm.created_at,
          });
        }

        // Get role permissions
        if (roleIds.length > 0) {
          const rolePerms = await db.manyOrNone<
            RolePermissionDbRow & { role_id: string }
          >(
            `SELECT * FROM role_permission
             WHERE role_id = ANY($(roleIds)) AND org_id = $(orgId)
             ${resourceFilter} ${actionFilter}`,
            params,
          );

          for (const perm of rolePerms) {
            permissions.push({
              resourceId: perm.resource_id,
              action: perm.action,
              source: "role",
              sourceId: perm.role_id,
              createdAt: perm.created_at,
            });
          }
        }

        return { success: true, data: permissions };
      } catch (error) {
        logger.error("Failed to get effective permissions", { error, userId });
        return { success: false, error: error as Error };
      }
    },

    async hasPermission(
      inputOrgId: string,
      userId: string,
      resourceId: string,
      action: string,
    ): Promise<Result<boolean>> {
      try {
        // Complex EXISTS + wildcard queries need raw SQL
        const userPerm = await db.oneOrNone<{ exists: boolean }>(
          `SELECT EXISTS(
            SELECT 1 FROM user_permission
            WHERE user_id = $(userId) AND org_id = $(orgId)
            AND (
              (resource_id = $(resourceId) AND (action = $(action) OR action = '*'))
              OR ($(resourceId) LIKE REPLACE(resource_id, '*', '') || '%' AND (action = $(action) OR action = '*'))
            )
          ) as exists`,
          { userId, orgId: inputOrgId, resourceId, action },
        );

        if (userPerm?.exists) {
          return { success: true, data: true };
        }

        // Check role permissions
        const rolePerm = await db.oneOrNone<{ exists: boolean }>(
          `SELECT EXISTS(
            SELECT 1 FROM role_permission rp
            INNER JOIN user_role ur ON rp.role_id = ur.role_id AND rp.org_id = ur.org_id
            WHERE ur.user_id = $(userId) AND ur.org_id = $(orgId)
            AND (
              (rp.resource_id = $(resourceId) AND (rp.action = $(action) OR rp.action = '*'))
              OR ($(resourceId) LIKE REPLACE(rp.resource_id, '*', '') || '%' AND (rp.action = $(action) OR rp.action = '*'))
            )
          ) as exists`,
          { userId, orgId: inputOrgId, resourceId, action },
        );

        return { success: true, data: rolePerm?.exists ?? false };
      } catch (error) {
        logger.error("Failed to check permission", {
          error,
          userId,
          resourceId,
          action,
        });
        return { success: false, error: error as Error };
      }
    },

    async getEffectivePermissionsByPrefix(
      inputOrgId: string,
      userId: string,
      resourceIdPrefix: string,
    ): Promise<Result<EffectivePermission[]>> {
      try {
        // Get user's role IDs using Tinqer
        const userRoles = await executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q
              .from("user_role")
              .where((ur) => ur.user_id === p.userId && ur.org_id === p.orgId),
          { userId, orgId: inputOrgId },
        );
        const roleIds = userRoles.map((r) => r.role_id);

        const permissions: EffectivePermission[] = [];
        const params: Record<string, unknown> = {
          userId,
          orgId: inputOrgId,
          roleIds,
          prefix: `${resourceIdPrefix}%`,
        };

        // LIKE queries with array parameters need raw SQL
        const userPerms = await db.manyOrNone<UserPermissionDbRow>(
          `SELECT * FROM user_permission
           WHERE user_id = $(userId) AND org_id = $(orgId)
           AND resource_id LIKE $(prefix)`,
          params,
        );

        for (const perm of userPerms) {
          permissions.push({
            resourceId: perm.resource_id,
            action: perm.action,
            source: "user",
            sourceId: userId,
            createdAt: perm.created_at,
          });
        }

        if (roleIds.length > 0) {
          const rolePerms = await db.manyOrNone<
            RolePermissionDbRow & { role_id: string }
          >(
            `SELECT * FROM role_permission
             WHERE role_id = ANY($(roleIds)) AND org_id = $(orgId)
             AND resource_id LIKE $(prefix)`,
            params,
          );

          for (const perm of rolePerms) {
            permissions.push({
              resourceId: perm.resource_id,
              action: perm.action,
              source: "role",
              sourceId: perm.role_id,
              createdAt: perm.created_at,
            });
          }
        }

        return { success: true, data: permissions };
      } catch (error) {
        logger.error("Failed to get permissions by prefix", {
          error,
          userId,
          resourceIdPrefix,
        });
        return { success: false, error: error as Error };
      }
    },
  };
}
