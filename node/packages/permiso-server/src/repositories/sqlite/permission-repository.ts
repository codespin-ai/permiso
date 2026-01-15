/**
 * SQLite Permission Repository
 *
 * Uses Tinqer for type-safe queries with app-level tenant filtering.
 * Handles both user permissions and role permissions.
 * Includes wildcard matching for resource paths (e.g., /india/* matches /india/data)
 */

import { createLogger } from "@codespin/permiso-logger";
import {
  executeSelect,
  executeDelete,
} from "@tinqerjs/better-sqlite3-adapter";
import type { Database } from "better-sqlite3";
import { schema } from "../tinqer-schema.js";
import type {
  IPermissionRepository,
  UserPermission,
  RolePermission,
  EffectivePermission,
  GrantPermissionInput,
  Result,
} from "../interfaces/index.js";

const logger = createLogger("permiso-server:repos:sqlite:permission");

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

/**
 * Check if a resource ID matches a pattern (supports wildcard *)
 * Pattern "/india/*" matches "/india/data", "/india/foo/bar"
 */
function matchesPattern(pattern: string, resourceId: string): boolean {
  if (pattern === resourceId) return true;
  if (!pattern.includes("*")) return false;

  const prefix = pattern.replace("*", "");
  return resourceId.startsWith(prefix);
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
        // Use raw SQL for INSERT OR IGNORE
        const stmt = db.prepare(
          `INSERT OR IGNORE INTO user_permission (user_id, org_id, resource_id, action, created_at)
           VALUES (@user_id, @org_id, @resource_id, @action, @created_at)`,
        );
        stmt.run({
          user_id: userId,
          org_id: inputOrgId,
          resource_id: input.resourceId,
          action: input.action,
          created_at: now,
        });

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
        logger.error("Failed to grant user permission", { error, userId, input });
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
        executeDelete(
          db,
          schema,
          (q, p: { userId: string; orgId: string; resourceId: string; action: string }) =>
            q.deleteFrom("user_permission").where(
              (up) =>
                up.user_id === p.userId &&
                up.org_id === p.orgId &&
                up.resource_id === p.resourceId &&
                up.action === p.action,
            ),
          { userId, orgId: inputOrgId, resourceId, action },
        );
        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to revoke user permission", { error, userId, resourceId, action });
        return { success: false, error: error as Error };
      }
    },

    async getUserPermissions(
      inputOrgId: string,
      userId: string,
    ): Promise<Result<UserPermission[]>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user_permission").where(
              (up) => up.user_id === p.userId && up.org_id === p.orgId,
            ),
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
        // Use raw SQL for INSERT OR IGNORE
        const stmt = db.prepare(
          `INSERT OR IGNORE INTO role_permission (role_id, org_id, resource_id, action, created_at)
           VALUES (@role_id, @org_id, @resource_id, @action, @created_at)`,
        );
        stmt.run({
          role_id: roleId,
          org_id: inputOrgId,
          resource_id: input.resourceId,
          action: input.action,
          created_at: now,
        });

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
        logger.error("Failed to grant role permission", { error, roleId, input });
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
        executeDelete(
          db,
          schema,
          (q, p: { roleId: string; orgId: string; resourceId: string; action: string }) =>
            q.deleteFrom("role_permission").where(
              (rp) =>
                rp.role_id === p.roleId &&
                rp.org_id === p.orgId &&
                rp.resource_id === p.resourceId &&
                rp.action === p.action,
            ),
          { roleId, orgId: inputOrgId, resourceId, action },
        );
        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to revoke role permission", { error, roleId, resourceId, action });
        return { success: false, error: error as Error };
      }
    },

    async getRolePermissions(
      inputOrgId: string,
      roleId: string,
    ): Promise<Result<RolePermission[]>> {
      try {
        const rows = executeSelect(
          db,
          schema,
          (q, p: { roleId: string; orgId: string }) =>
            q.from("role_permission").where(
              (rp) => rp.role_id === p.roleId && rp.org_id === p.orgId,
            ),
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
        const userRows = executeSelect(
          db,
          schema,
          (q, p: { resourceId: string; orgId: string }) =>
            q.from("user_permission").where(
              (up) => up.resource_id === p.resourceId && up.org_id === p.orgId,
            ),
          { resourceId, orgId: inputOrgId },
        );
        const roleRows = executeSelect(
          db,
          schema,
          (q, p: { resourceId: string; orgId: string }) =>
            q.from("role_permission").where(
              (rp) => rp.resource_id === p.resourceId && rp.org_id === p.orgId,
            ),
          { resourceId, orgId: inputOrgId },
        );

        return {
          success: true,
          data: {
            userPermissions: userRows.map(mapUserPermissionFromDb),
            rolePermissions: roleRows.map(mapRolePermissionFromDb),
          },
        };
      } catch (error) {
        logger.error("Failed to get permissions by resource", { error, resourceId });
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
        const userRoles = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user_role").where(
              (ur) => ur.user_id === p.userId && ur.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );
        const roleIds = userRoles.map((r) => r.role_id);

        const permissions: EffectivePermission[] = [];

        // Get direct user permissions
        const userPerms = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user_permission").where(
              (up) => up.user_id === p.userId && up.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );

        for (const perm of userPerms) {
          // Apply filters in application code
          if (
            resourceId &&
            !matchesPattern(perm.resource_id, resourceId) &&
            perm.resource_id !== resourceId
          ) {
            continue;
          }
          if (action && perm.action !== action && perm.action !== "*") {
            continue;
          }

          permissions.push({
            resourceId: perm.resource_id,
            action: perm.action,
            source: "user",
            sourceId: userId,
            createdAt: perm.created_at,
          });
        }

        // Get role permissions
        for (const roleId of roleIds) {
          const rolePerms = executeSelect(
            db,
            schema,
            (q, p: { roleId: string; orgId: string }) =>
              q.from("role_permission").where(
                (rp) => rp.role_id === p.roleId && rp.org_id === p.orgId,
              ),
            { roleId, orgId: inputOrgId },
          );

          for (const perm of rolePerms) {
            // Apply filters in application code
            if (
              resourceId &&
              !matchesPattern(perm.resource_id, resourceId) &&
              perm.resource_id !== resourceId
            ) {
              continue;
            }
            if (action && perm.action !== action && perm.action !== "*") {
              continue;
            }

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
        // Get all user permissions and check with wildcard matching
        const userPerms = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user_permission").where(
              (up) => up.user_id === p.userId && up.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );

        for (const perm of userPerms) {
          const resourceMatches =
            matchesPattern(perm.resource_id, resourceId) ||
            perm.resource_id === resourceId;
          const actionMatches = perm.action === action || perm.action === "*";
          if (resourceMatches && actionMatches) {
            return { success: true, data: true };
          }
        }

        // Get user's role IDs
        const userRoles = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user_role").where(
              (ur) => ur.user_id === p.userId && ur.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );
        const roleIds = userRoles.map((r) => r.role_id);

        // Check role permissions
        for (const roleId of roleIds) {
          const rolePerms = executeSelect(
            db,
            schema,
            (q, p: { roleId: string; orgId: string }) =>
              q.from("role_permission").where(
                (rp) => rp.role_id === p.roleId && rp.org_id === p.orgId,
              ),
            { roleId, orgId: inputOrgId },
          );

          for (const perm of rolePerms) {
            const resourceMatches =
              matchesPattern(perm.resource_id, resourceId) ||
              perm.resource_id === resourceId;
            const actionMatches = perm.action === action || perm.action === "*";
            if (resourceMatches && actionMatches) {
              return { success: true, data: true };
            }
          }
        }

        return { success: true, data: false };
      } catch (error) {
        logger.error("Failed to check permission", { error, userId, resourceId, action });
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
        const userRoles = executeSelect(
          db,
          schema,
          (q, p: { userId: string; orgId: string }) =>
            q.from("user_role").where(
              (ur) => ur.user_id === p.userId && ur.org_id === p.orgId,
            ),
          { userId, orgId: inputOrgId },
        );
        const roleIds = userRoles.map((r) => r.role_id);

        const permissions: EffectivePermission[] = [];

        // Get direct user permissions matching prefix (use raw SQL for LIKE)
        const userPermsStmt = db.prepare(
          `SELECT * FROM user_permission
           WHERE user_id = @userId AND org_id = @orgId
           AND resource_id LIKE @prefix`,
        );
        const userPerms = userPermsStmt.all({
          userId,
          orgId: inputOrgId,
          prefix: `${resourceIdPrefix}%`,
        }) as Array<{
          user_id: string;
          org_id: string;
          resource_id: string;
          action: string;
          created_at: number;
        }>;

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
        for (const roleId of roleIds) {
          const rolePermsStmt = db.prepare(
            `SELECT * FROM role_permission
             WHERE role_id = @roleId AND org_id = @orgId
             AND resource_id LIKE @prefix`,
          );
          const rolePerms = rolePermsStmt.all({
            roleId,
            orgId: inputOrgId,
            prefix: `${resourceIdPrefix}%`,
          }) as Array<{
            role_id: string;
            org_id: string;
            resource_id: string;
            action: string;
            created_at: number;
          }>;

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
        logger.error("Failed to get permissions by prefix", { error, userId, resourceIdPrefix });
        return { success: false, error: error as Error };
      }
    },
  };
}
