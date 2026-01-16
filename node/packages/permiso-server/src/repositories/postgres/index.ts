/**
 * PostgreSQL Repositories
 *
 * Creates all repository implementations for PostgreSQL.
 * Uses RLS for tenant isolation.
 */

import type { Database } from "@codespin/permiso-db";
import type { Repositories } from "../interfaces/index.js";
import { createUserRepository } from "./user-repository.js";
import { createOrganizationRepository } from "./organization-repository.js";
import { createRoleRepository } from "./role-repository.js";
import { createResourceRepository } from "./resource-repository.js";
import { createPermissionRepository } from "./permission-repository.js";

export function createPostgresRepositories(
  db: Database,
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
