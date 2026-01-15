/**
 * User Repository Interface
 * Database-agnostic contract for user data access
 */

import type {
  Result,
  PaginationInput,
  Connection,
  PropertyInput,
  Property,
} from "./types.js";

// User entity (domain model, not GraphQL)
export type User = {
  id: string;
  orgId: string;
  identityProvider: string;
  identityProviderUserId: string;
  createdAt: number;
  updatedAt: number;
};

// Filter for listing users
export type UserFilter = {
  identityProvider?: string;
};

// Input for creating a user
export type CreateUserInput = {
  id: string;
  identityProvider: string;
  identityProviderUserId: string;
  properties?: PropertyInput[];
  roleIds?: string[];
};

// Input for updating a user
export type UpdateUserInput = {
  identityProvider?: string;
  identityProviderUserId?: string;
};

export type IUserRepository = {
  // CRUD operations
  create(orgId: string, input: CreateUserInput): Promise<Result<User>>;
  getById(orgId: string, userId: string): Promise<Result<User | null>>;
  getByIdentity(
    orgId: string,
    identityProvider: string,
    identityProviderUserId: string,
  ): Promise<Result<User | null>>;
  list(
    orgId: string,
    filter?: UserFilter,
    pagination?: PaginationInput,
  ): Promise<Result<Connection<User>>>;
  listByOrg(
    orgId: string,
    pagination?: PaginationInput,
  ): Promise<Result<Connection<User>>>;
  update(
    orgId: string,
    userId: string,
    input: UpdateUserInput,
  ): Promise<Result<User>>;
  delete(orgId: string, userId: string): Promise<Result<boolean>>;

  // Role assignments
  assignRole(
    orgId: string,
    userId: string,
    roleId: string,
  ): Promise<Result<void>>;
  unassignRole(
    orgId: string,
    userId: string,
    roleId: string,
  ): Promise<Result<void>>;
  getRoleIds(orgId: string, userId: string): Promise<Result<string[]>>;

  // Properties
  getProperties(orgId: string, userId: string): Promise<Result<Property[]>>;
  getProperty(
    orgId: string,
    userId: string,
    name: string,
  ): Promise<Result<Property | null>>;
  setProperty(
    orgId: string,
    userId: string,
    property: PropertyInput,
  ): Promise<Result<Property>>;
  deleteProperty(
    orgId: string,
    userId: string,
    name: string,
  ): Promise<Result<boolean>>;
};
