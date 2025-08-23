import { typeUtils } from "@codespin/permiso-core";
import type {
  Organization,
  OrganizationDbRow,
  Property,
  PropertyDbRow,
  Role,
  RoleDbRow,
  User,
  UserDbRow,
  Resource,
  ResourceDbRow,
  UserRole,
  UserRoleDbRow,
  UserPermissionWithOrgId,
  UserPermissionDbRow,
  RolePermissionWithOrgId,
  RolePermissionDbRow,
} from "./types.js";

// Organization mappers
export function mapOrganizationFromDb(row: OrganizationDbRow): Organization {
  return {
    ...typeUtils.toCamelCase(row),
    __typename: "Organization",
    // These will be populated by GraphQL resolvers
    properties: [],
    resources: {
      __typename: "ResourceConnection",
      nodes: [],
      totalCount: 0,
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
    roles: {
      __typename: "RoleConnection",
      nodes: [],
      totalCount: 0,
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
    users: {
      __typename: "UserConnection",
      nodes: [],
      totalCount: 0,
      pageInfo: {
        __typename: "PageInfo",
        hasNextPage: false,
        hasPreviousPage: false,
        startCursor: null,
        endCursor: null,
      },
    },
  };
}

// Unified Property mapper
export function mapPropertyFromDb(row: PropertyDbRow): Property {
  // Cannot use toCamelCase here because PropertyDbRow has parent_id and org_id
  // which are not part of the Property type
  return {
    name: row.name,
    value: row.value,
    hidden: row.hidden,
    createdAt: row.created_at,
  };
}

// Legacy mappers for backward compatibility
export const mapOrganizationPropertyFromDb = mapPropertyFromDb;
export const mapRolePropertyFromDb = mapPropertyFromDb;
export const mapUserPropertyFromDb = mapPropertyFromDb;

// Role mappers
export function mapRoleFromDb(row: RoleDbRow): Role {
  return {
    ...typeUtils.toCamelCase(row),
    __typename: "Role",
    // These will be populated by GraphQL resolvers
    organization: {} as Organization,
    permissions: [],
    properties: [],
    users: [],
  };
}

// User mappers
export function mapUserFromDb(row: UserDbRow): User {
  return {
    ...typeUtils.toCamelCase(row),
    __typename: "User",
    // These will be populated by GraphQL resolvers
    organization: {} as Organization,
    roles: [],
    permissions: [],
    properties: [],
    effectivePermissions: [],
  };
}

// Resource mappers
export function mapResourceFromDb(row: ResourceDbRow): Resource {
  return {
    ...typeUtils.toCamelCase(row),
    __typename: "Resource",
    // These will be populated by GraphQL resolvers
    organization: {} as Organization,
    permissions: [],
  };
}

// User Role mappers
export function mapUserRoleFromDb(row: UserRoleDbRow): UserRole {
  return typeUtils.toCamelCase(row);
}

export function mapUserRoleToDb(userRole: UserRole): UserRoleDbRow {
  return typeUtils.toSnakeCase(userRole);
}

// User Permission mappers
export function mapUserPermissionFromDb(
  row: UserPermissionDbRow,
): UserPermissionWithOrgId {
  return typeUtils.toCamelCase(row);
}

export function mapUserPermissionToDb(
  perm: UserPermissionWithOrgId,
): UserPermissionDbRow {
  return typeUtils.toSnakeCase(perm);
}

// Role Permission mappers
export function mapRolePermissionFromDb(
  row: RolePermissionDbRow,
): RolePermissionWithOrgId {
  return typeUtils.toCamelCase(row);
}

export function mapRolePermissionToDb(
  perm: RolePermissionWithOrgId,
): RolePermissionDbRow {
  return typeUtils.toSnakeCase(perm);
}
