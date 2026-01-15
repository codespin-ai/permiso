/**
 * SQLite Repositories
 *
 * Creates all repository implementations for SQLite.
 * Uses Tinqer for type-safe queries with explicit org_id filtering (no RLS).
 */

import type { Database } from "better-sqlite3";
import type { Repositories } from "../interfaces/index.js";
import { createUserRepository } from "./user-repository.js";
import { createOrganizationRepository } from "./organization-repository.js";
import { createRoleRepository } from "./role-repository.js";
import { createResourceRepository } from "./resource-repository.js";
import { createPermissionRepository } from "./permission-repository.js";

export type SQLiteDb = Database;

export function createSqliteRepositories(
  db: SQLiteDb,
  orgId: string,
): Repositories {
  return {
    user: createUserRepository(db, orgId),
    organization: createOrganizationRepository(db),
    role: createRoleRepository(db, orgId),
    resource: createResourceRepository(db, orgId),
    permission: createPermissionRepository(db, orgId),
  };
}
