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
    __typename: "Organization",
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
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

export function mapOrganizationToDb(
  org: Partial<Organization>,
): Partial<OrganizationDbRow> {
  return {
    id: org.id,
    name: org.name,
    description: org.description ?? null,
    created_at: org.createdAt,
    updated_at: org.updatedAt,
  };
}

// Unified Property mapper
export function mapPropertyFromDb(row: PropertyDbRow): Property {
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
    __typename: "Role",
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // These will be populated by GraphQL resolvers
    organization: {} as Organization,
    permissions: [],
    properties: [],
    users: [],
  };
}

export function mapRoleToDb(role: Partial<Role>): Partial<RoleDbRow> {
  return {
    id: role.id,
    org_id: role.orgId,
    name: role.name,
    description: role.description ?? null,
    created_at: role.createdAt,
    updated_at: role.updatedAt,
  };
}

// User mappers
export function mapUserFromDb(row: UserDbRow): User {
  return {
    __typename: "User",
    id: row.id,
    orgId: row.org_id,
    identityProvider: row.identity_provider,
    identityProviderUserId: row.identity_provider_user_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // These will be populated by GraphQL resolvers
    organization: {} as Organization,
    roles: [],
    permissions: [],
    properties: [],
    effectivePermissions: [],
  };
}

export function mapUserToDb(user: Partial<User>): Partial<UserDbRow> {
  return {
    id: user.id,
    org_id: user.orgId,
    identity_provider: user.identityProvider,
    identity_provider_user_id: user.identityProviderUserId,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

// Resource mappers
export function mapResourceFromDb(row: ResourceDbRow): Resource {
  return {
    __typename: "Resource",
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    // These will be populated by GraphQL resolvers
    organization: {} as Organization,
    permissions: [],
  };
}

export function mapResourceToDb(
  resource: Partial<Resource>,
): Partial<ResourceDbRow> {
  return {
    id: resource.id,
    org_id: resource.orgId,
    name: resource.name ?? null,
    description: resource.description ?? null,
    created_at: resource.createdAt,
    updated_at: resource.updatedAt,
  };
}

// User Role mappers
export function mapUserRoleFromDb(row: UserRoleDbRow): UserRole {
  return {
    userId: row.user_id,
    roleId: row.role_id,
    orgId: row.org_id,
    createdAt: row.created_at,
  };
}

export function mapUserRoleToDb(userRole: UserRole): UserRoleDbRow {
  return {
    user_id: userRole.userId,
    role_id: userRole.roleId,
    org_id: userRole.orgId,
    created_at: userRole.createdAt,
  };
}

// User Permission mappers
export function mapUserPermissionFromDb(
  row: UserPermissionDbRow,
): UserPermissionWithOrgId {
  return {
    userId: row.user_id,
    orgId: row.org_id,
    resourceId: row.resource_id,
    action: row.action,
    createdAt: row.created_at,
  };
}

export function mapUserPermissionToDb(
  perm: UserPermissionWithOrgId,
): UserPermissionDbRow {
  return {
    user_id: perm.userId,
    org_id: perm.orgId,
    resource_id: perm.resourceId,
    action: perm.action,
    created_at: perm.createdAt,
  };
}

// Role Permission mappers
export function mapRolePermissionFromDb(
  row: RolePermissionDbRow,
): RolePermissionWithOrgId {
  return {
    roleId: row.role_id,
    orgId: row.org_id,
    resourceId: row.resource_id,
    action: row.action,
    createdAt: row.created_at,
  };
}

export function mapRolePermissionToDb(
  perm: RolePermissionWithOrgId,
): RolePermissionDbRow {
  return {
    role_id: perm.roleId,
    org_id: perm.orgId,
    resource_id: perm.resourceId,
    action: perm.action,
    created_at: perm.createdAt,
  };
}
