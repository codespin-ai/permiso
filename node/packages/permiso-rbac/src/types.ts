// Domain types
export type Organization = {
  id: string;
  name: string;
  description?: string;
  data?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type OrganizationProperty = {
  orgId: string;
  name: string;
  value: string;
  hidden: boolean;
  createdAt: Date;
};

export type Role = {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  data?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type RoleProperty = {
  roleId: string;
  orgId: string;
  name: string;
  value: string;
  hidden: boolean;
  createdAt: Date;
};

export type User = {
  id: string;
  orgId: string;
  identityProvider: string;
  identityProviderUserId: string;
  data?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserProperty = {
  userId: string;
  orgId: string;
  name: string;
  value: string;
  hidden: boolean;
  createdAt: Date;
};

export type Resource = {
  id: string; // This is the path (e.g., /india/data/legal)
  orgId: string;
  name?: string;
  description?: string;
  data?: string;
  createdAt: Date;
  updatedAt: Date;
};

export type UserRole = {
  userId: string;
  roleId: string;
  orgId: string;
  createdAt: Date;
};

export type UserPermission = {
  userId: string;
  orgId: string;
  resourceId: string;
  action: string;
  createdAt: Date;
};

export type RolePermission = {
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

// Input types
export type CreateOrganizationInput = {
  id: string;
  name: string;
  description?: string;
  data?: string;
  properties?: Array<{ name: string; value: string; hidden?: boolean }>;
};

export type UpdateOrganizationInput = {
  name?: string;
  description?: string;
  data?: string;
};

export type CreateRoleInput = {
  id: string;
  orgId: string;
  name: string;
  description?: string;
  data?: string;
  properties?: Array<{ name: string; value: string; hidden?: boolean }>;
};

export type UpdateRoleInput = {
  name?: string;
  description?: string;
  data?: string;
};

export type CreateUserInput = {
  id: string;
  orgId: string;
  identityProvider: string;
  identityProviderUserId: string;
  data?: string;
  properties?: Array<{ name: string; value: string; hidden?: boolean }>;
  roleIds?: string[];
};

export type UpdateUserInput = {
  identityProvider?: string;
  identityProviderUserId?: string;
  data?: string;
};

export type CreateResourceInput = {
  path: string; // becomes the id
  orgId: string;
  name?: string;
  description?: string;
  data?: string;
};

export type UpdateResourceInput = {
  name?: string;
  description?: string;
  data?: string;
};

export type PropertyFilter = {
  name: string;
  value: string;
};

export type PaginationInput = {
  offset?: number;
  limit?: number;
};

// Extended types with properties
export type OrganizationWithProperties = Organization & {
  properties: Record<string, string>;
};

export type RoleWithProperties = Role & {
  properties: Record<string, string>;
};

export type UserWithProperties = User & {
  properties: Record<string, string>;
  roleIds: string[];
};

// Permission types
export type Permission = UserPermission | RolePermission;

export type EffectivePermission = {
  resourceId: string;
  action: string;
  source: 'user' | 'role';
  sourceId?: string; // userId or roleId
  createdAt: Date;
};