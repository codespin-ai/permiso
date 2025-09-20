// Re-export all GraphQL generated types
export * from "./generated/graphql.js";

// Permission types with orgId (for internal use, since GraphQL doesn't have orgId)
export type UserPermissionWithOrgId = {
  userId: string;
  orgId: string;
  resourceId: string;
  action: string;
  createdAt: number;
};

export type RolePermissionWithOrgId = {
  roleId: string;
  orgId: string;
  resourceId: string;
  action: string;
  createdAt: number;
};

// Database row types (snake_case)
export type OrganizationDbRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type PropertyDbRow = {
  parent_id: string;
  org_id?: string; // Only for user_property and role_property
  name: string;
  value: unknown; // JSONB value
  hidden: boolean;
  created_at: number;
};

// Legacy type aliases for backward compatibility during migration
export type OrganizationPropertyDbRow = PropertyDbRow;
export type UserPropertyDbRow = PropertyDbRow;
export type RolePropertyDbRow = PropertyDbRow;

export type RoleDbRow = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type UserDbRow = {
  id: string;
  org_id: string;
  identity_provider: string;
  identity_provider_user_id: string;
  created_at: number;
  updated_at: number;
};

export type ResourceDbRow = {
  id: string;
  org_id: string;
  name: string | null;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type UserRoleDbRow = {
  user_id: string;
  role_id: string;
  org_id: string;
  created_at: number;
};

export type UserPermissionDbRow = {
  user_id: string;
  org_id: string;
  resource_id: string;
  action: string;
  created_at: number;
};

export type RolePermissionDbRow = {
  role_id: string;
  org_id: string;
  resource_id: string;
  action: string;
  created_at: number;
};

// Domain-specific types that bridge database and GraphQL

// Join table type
export type UserRole = {
  userId: string;
  roleId: string;
  orgId: string;
  createdAt: number;
};

// Extended types with properties as Record (for internal use)
export type OrganizationWithProperties = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: number;
  updatedAt: number;
  properties: Record<string, unknown>;
};

export type RoleWithProperties = {
  id: string;
  orgId: string;
  name: string;
  description?: string | null;
  createdAt: number;
  updatedAt: number;
  properties: Record<string, unknown>;
};

export type UserWithProperties = {
  id: string;
  orgId: string;
  identityProvider: string;
  identityProviderUserId: string;
  createdAt: number;
  updatedAt: number;
  properties: Record<string, unknown>;
  roleIds: string[];
};
