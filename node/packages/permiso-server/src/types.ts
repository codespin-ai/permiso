// Re-export all GraphQL generated types
export * from './generated/graphql.js';


// Permission types with orgId (for internal use, since GraphQL doesn't have orgId)
export type UserPermissionWithOrgId = {
  userId: string;
  orgId: string;
  resourceId: string;
  action: string;
  createdAt: Date;
};

export type RolePermissionWithOrgId = {
  roleId: string;
  orgId: string;  
  resourceId: string;
  action: string;
  createdAt: Date;
};

// Database row types (snake_case)
export type OrganizationDbRow = {
  id: string;
  name: string;
  description: string | null;
  data: string | null;
  created_at: Date;
  updated_at: Date;
};

export type OrganizationPropertyDbRow = {
  org_id: string;
  name: string;
  value: string;
  hidden: boolean;
  created_at: Date;
};

export type RoleDbRow = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  data: string | null;
  created_at: Date;
  updated_at: Date;
};

export type RolePropertyDbRow = {
  role_id: string;
  org_id: string;
  name: string;
  value: string;
  hidden: boolean;
  created_at: Date;
};

export type UserDbRow = {
  id: string;
  org_id: string;
  identity_provider: string;
  identity_provider_user_id: string;
  data: string | null;
  created_at: Date;
  updated_at: Date;
};

export type UserPropertyDbRow = {
  user_id: string;
  org_id: string;
  name: string;
  value: string;
  hidden: boolean;
  created_at: Date;
};

export type ResourceDbRow = {
  id: string;
  org_id: string;
  name: string | null;
  description: string | null;
  data: string | null;
  created_at: Date;
  updated_at: Date;
};

export type UserRoleDbRow = {
  user_id: string;
  role_id: string;
  org_id: string;
  created_at: Date;
};

export type UserPermissionDbRow = {
  user_id: string;
  org_id: string;
  resource_id: string;
  action: string;
  created_at: Date;
};

export type RolePermissionDbRow = {
  role_id: string;
  org_id: string;
  resource_id: string;
  action: string;
  created_at: Date;
};


// Domain-specific types that bridge database and GraphQL

// Property types for different entities (all map to GraphQL's Property type)
export type OrganizationProperty = {
  orgId: string;
  name: string;
  value: string;
  hidden: boolean;
  createdAt: Date;
};

export type RoleProperty = {
  roleId: string;
  orgId: string;
  name: string;
  value: string;
  hidden: boolean;
  createdAt: Date;
};

export type UserProperty = {
  userId: string;
  orgId: string;
  name: string;
  value: string;
  hidden: boolean;
  createdAt: Date;
};

// Join table type
export type UserRole = {
  userId: string;
  roleId: string;
  orgId: string;
  createdAt: Date;
};

// Extended types with properties as Record (for internal use)
export type OrganizationWithProperties = {
  id: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  properties: Record<string, string>;
};

export type RoleWithProperties = {
  id: string;
  orgId: string;
  name: string;
  description?: string | null;
  createdAt: Date;
  updatedAt: Date;
  properties: Record<string, string>;
};

export type UserWithProperties = {
  id: string;
  orgId: string;
  identityProvider: string;
  identityProviderUserId: string;
  data?: string | null;
  createdAt: Date;
  updatedAt: Date;
  properties: Record<string, string>;
  roleIds: string[];
};

