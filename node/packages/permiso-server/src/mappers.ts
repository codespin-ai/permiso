import type {
  Organization,
  OrganizationDbRow,
  OrganizationProperty,
  OrganizationPropertyDbRow,
  Role,
  RoleDbRow,
  RoleProperty,
  RolePropertyDbRow,
  User,
  UserDbRow,
  UserProperty,
  UserPropertyDbRow,
  Resource,
  ResourceDbRow,
  UserRole,
  UserRoleDbRow,
  UserPermission,
  UserPermissionDbRow,
  RolePermission,
  RolePermissionDbRow
} from './types.js';

// Organization mappers
export function mapOrganizationFromDb(row: OrganizationDbRow): Organization {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? undefined,
    data: row.data ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapOrganizationToDb(org: Partial<Organization>): Partial<OrganizationDbRow> {
  return {
    id: org.id,
    name: org.name,
    description: org.description ?? null,
    data: org.data ?? null,
    created_at: org.createdAt,
    updated_at: org.updatedAt
  };
}

// Organization Property mappers
export function mapOrganizationPropertyFromDb(row: OrganizationPropertyDbRow): OrganizationProperty {
  return {
    orgId: row.org_id,
    name: row.name,
    value: row.value,
    hidden: row.hidden,
    createdAt: row.created_at
  };
}

export function mapOrganizationPropertyToDb(prop: OrganizationProperty): OrganizationPropertyDbRow {
  return {
    org_id: prop.orgId,
    name: prop.name,
    value: prop.value,
    hidden: prop.hidden,
    created_at: prop.createdAt
  };
}

// Role mappers
export function mapRoleFromDb(row: RoleDbRow): Role {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name,
    description: row.description ?? undefined,
    data: row.data ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapRoleToDb(role: Partial<Role>): Partial<RoleDbRow> {
  return {
    id: role.id,
    org_id: role.orgId,
    name: role.name,
    description: role.description ?? null,
    data: role.data ?? null,
    created_at: role.createdAt,
    updated_at: role.updatedAt
  };
}

// Role Property mappers
export function mapRolePropertyFromDb(row: RolePropertyDbRow): RoleProperty {
  return {
    roleId: row.role_id,
    orgId: row.org_id,
    name: row.name,
    value: row.value,
    hidden: row.hidden,
    createdAt: row.created_at
  };
}

export function mapRolePropertyToDb(prop: RoleProperty): RolePropertyDbRow {
  return {
    role_id: prop.roleId,
    org_id: prop.orgId,
    name: prop.name,
    value: prop.value,
    hidden: prop.hidden,
    created_at: prop.createdAt
  };
}

// User mappers
export function mapUserFromDb(row: UserDbRow): User {
  return {
    id: row.id,
    orgId: row.org_id,
    identityProvider: row.identity_provider,
    identityProviderUserId: row.identity_provider_user_id,
    data: row.data ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapUserToDb(user: Partial<User>): Partial<UserDbRow> {
  return {
    id: user.id,
    org_id: user.orgId,
    identity_provider: user.identityProvider,
    identity_provider_user_id: user.identityProviderUserId,
    data: user.data ?? null,
    created_at: user.createdAt,
    updated_at: user.updatedAt
  };
}

// User Property mappers
export function mapUserPropertyFromDb(row: UserPropertyDbRow): UserProperty {
  return {
    userId: row.user_id,
    orgId: row.org_id,
    name: row.name,
    value: row.value,
    hidden: row.hidden,
    createdAt: row.created_at
  };
}

export function mapUserPropertyToDb(prop: UserProperty): UserPropertyDbRow {
  return {
    user_id: prop.userId,
    org_id: prop.orgId,
    name: prop.name,
    value: prop.value,
    hidden: prop.hidden,
    created_at: prop.createdAt
  };
}

// Resource mappers
export function mapResourceFromDb(row: ResourceDbRow): Resource {
  return {
    id: row.id,
    orgId: row.org_id,
    name: row.name ?? undefined,
    description: row.description ?? undefined,
    data: row.data ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapResourceToDb(resource: Partial<Resource>): Partial<ResourceDbRow> {
  return {
    id: resource.id,
    org_id: resource.orgId,
    name: resource.name ?? null,
    description: resource.description ?? null,
    data: resource.data ?? null,
    created_at: resource.createdAt,
    updated_at: resource.updatedAt
  };
}

// User Role mappers
export function mapUserRoleFromDb(row: UserRoleDbRow): UserRole {
  return {
    userId: row.user_id,
    roleId: row.role_id,
    orgId: row.org_id,
    createdAt: row.created_at
  };
}

export function mapUserRoleToDb(userRole: UserRole): UserRoleDbRow {
  return {
    user_id: userRole.userId,
    role_id: userRole.roleId,
    org_id: userRole.orgId,
    created_at: userRole.createdAt
  };
}

// User Permission mappers
export function mapUserPermissionFromDb(row: UserPermissionDbRow): UserPermission {
  return {
    userId: row.user_id,
    orgId: row.org_id,
    resourceId: row.resource_id,
    action: row.action,
    createdAt: row.created_at
  };
}

export function mapUserPermissionToDb(perm: UserPermission): UserPermissionDbRow {
  return {
    user_id: perm.userId,
    org_id: perm.orgId,
    resource_id: perm.resourceId,
    action: perm.action,
    created_at: perm.createdAt
  };
}

// Role Permission mappers
export function mapRolePermissionFromDb(row: RolePermissionDbRow): RolePermission {
  return {
    roleId: row.role_id,
    orgId: row.org_id,
    resourceId: row.resource_id,
    action: row.action,
    createdAt: row.created_at
  };
}

export function mapRolePermissionToDb(perm: RolePermission): RolePermissionDbRow {
  return {
    role_id: perm.roleId,
    org_id: perm.orgId,
    resource_id: perm.resourceId,
    action: perm.action,
    created_at: perm.createdAt
  };
}