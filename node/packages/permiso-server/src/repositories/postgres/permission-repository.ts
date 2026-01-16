/**
 * PostgreSQL Permission Repository
 *
 * Handles both user permissions and role permissions.
 * Includes wildcard matching for resource paths (e.g., /india/* matches /india/data)
 */

import { createLogger } from "@codespin/permiso-logger";
import { sql, type Database } from "@codespin/permiso-db";
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

function mapUserPermissionFromDb(row: UserPermissionDbRow): UserPermission {
  return {
    userId: row.user_id,
    orgId: row.org_id,
    resourceId: row.resource_id,
    action: row.action,
    createdAt: row.created_at,
  };
}

function mapRolePermissionFromDb(row: RolePermissionDbRow): RolePermission {
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
        const params = {
          user_id: userId,
          org_id: inputOrgId,
          resource_id: input.resourceId,
          action: input.action,
          created_at: now,
        };

        // Upsert - if permission exists, just return it
        await db.none(
          `INSERT INTO user_permission (user_id, org_id, resource_id, action, created_at)
           VALUES ($(user_id), $(org_id), $(resource_id), $(action), $(created_at))
           ON CONFLICT (user_id, org_id, resource_id, action) DO NOTHING`,
          params,
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
        await db.none(
          `DELETE FROM user_permission
           WHERE user_id = $(userId) AND org_id = $(orgId)
           AND resource_id = $(resourceId) AND action = $(action)`,
          { userId, orgId: inputOrgId, resourceId, action },
        );
        return { success: true, data: true };
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
        const rows = await db.manyOrNone<UserPermissionDbRow>(
          `SELECT * FROM user_permission WHERE user_id = $(userId) AND org_id = $(orgId)`,
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
        const params = {
          role_id: roleId,
          org_id: inputOrgId,
          resource_id: input.resourceId,
          action: input.action,
          created_at: now,
        };

        await db.none(
          `INSERT INTO role_permission (role_id, org_id, resource_id, action, created_at)
           VALUES ($(role_id), $(org_id), $(resource_id), $(action), $(created_at))
           ON CONFLICT (role_id, org_id, resource_id, action) DO NOTHING`,
          params,
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
        await db.none(
          `DELETE FROM role_permission
           WHERE role_id = $(roleId) AND org_id = $(orgId)
           AND resource_id = $(resourceId) AND action = $(action)`,
          { roleId, orgId: inputOrgId, resourceId, action },
        );
        return { success: true, data: true };
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
        const rows = await db.manyOrNone<RolePermissionDbRow>(
          `SELECT * FROM role_permission WHERE role_id = $(roleId) AND org_id = $(orgId)`,
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
          db.manyOrNone<UserPermissionDbRow>(
            `SELECT * FROM user_permission WHERE resource_id = $(resourceId) AND org_id = $(orgId)`,
            { resourceId, orgId: inputOrgId },
          ),
          db.manyOrNone<RolePermissionDbRow>(
            `SELECT * FROM role_permission WHERE resource_id = $(resourceId) AND org_id = $(orgId)`,
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
        // Get user's role IDs
        const userRoles = await db.manyOrNone<UserRoleDbRow>(
          `SELECT * FROM user_role WHERE user_id = $(userId) AND org_id = $(orgId)`,
          { userId, orgId: inputOrgId },
        );
        const roleIds = userRoles.map((r) => r.role_id);

        const permissions: EffectivePermission[] = [];

        // Build filter conditions
        let resourceFilter = "";
        let actionFilter = "";
        const params: Record<string, unknown> = {
          userId,
          orgId: inputOrgId,
          roleIds,
        };

        if (resourceId) {
          // Match exact resource or wildcard patterns
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
        // Check direct user permission (including wildcards)
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
        // Get user's role IDs
        const userRoles = await db.manyOrNone<UserRoleDbRow>(
          `SELECT * FROM user_role WHERE user_id = $(userId) AND org_id = $(orgId)`,
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

        // Get direct user permissions matching prefix
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

        // Get role permissions matching prefix
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
