/**
 * Repository Interfaces
 *
 * Database-agnostic contracts for all data access operations.
 * These interfaces are implemented by both PostgreSQL and SQLite repositories.
 */

// Import types for use in Repositories type
import type { IUserRepository } from "./user-repository.js";
import type { IOrganizationRepository } from "./organization-repository.js";
import type { IRoleRepository } from "./role-repository.js";
import type { IResourceRepository } from "./resource-repository.js";
import type { IPermissionRepository } from "./permission-repository.js";

// Common types
export type {
  Result,
  PaginationInput,
  PageInfo,
  Connection,
  PropertyInput,
  Property,
  TransactionContext,
} from "./types.js";

// User repository
export type {
  User,
  UserFilter,
  CreateUserInput,
  UpdateUserInput,
  IUserRepository,
} from "./user-repository.js";

// Organization repository
export type {
  Organization,
  OrganizationFilter,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  IOrganizationRepository,
} from "./organization-repository.js";

// Role repository
export type {
  Role,
  RoleFilter,
  CreateRoleInput,
  UpdateRoleInput,
  IRoleRepository,
} from "./role-repository.js";

// Resource repository
export type {
  Resource,
  ResourceFilter,
  CreateResourceInput,
  UpdateResourceInput,
  IResourceRepository,
} from "./resource-repository.js";

// Permission repository
export type {
  UserPermission,
  RolePermission,
  EffectivePermission,
  GrantPermissionInput,
  IPermissionRepository,
} from "./permission-repository.js";

// Aggregate repository type for factory
export type Repositories = {
  user: IUserRepository;
  organization: IOrganizationRepository;
  role: IRoleRepository;
  resource: IResourceRepository;
  permission: IPermissionRepository;
};
