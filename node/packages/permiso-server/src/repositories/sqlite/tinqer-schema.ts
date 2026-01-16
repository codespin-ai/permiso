/**
 * Tinqer Schema for SQLite
 *
 * SQLite uses integers (0/1) for boolean values.
 */

import { createSchema } from "@tinqerjs/tinqer";

// Database row types (match SQLite table schemas)
export type OrganizationRow = {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type OrganizationPropertyRow = {
  parent_id: string;
  name: string;
  value: string; // JSON stringified
  hidden: number; // SQLite boolean (0/1)
  created_at: number;
};

export type UserRow = {
  id: string;
  org_id: string;
  identity_provider: string;
  identity_provider_user_id: string;
  created_at: number;
  updated_at: number;
};

export type UserPropertyRow = {
  parent_id: string;
  org_id: string;
  name: string;
  value: string; // JSON stringified
  hidden: number; // SQLite boolean (0/1)
  created_at: number;
};

export type RoleRow = {
  id: string;
  org_id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type RolePropertyRow = {
  parent_id: string;
  org_id: string;
  name: string;
  value: string; // JSON stringified
  hidden: number; // SQLite boolean (0/1)
  created_at: number;
};

export type ResourceRow = {
  id: string;
  org_id: string;
  name: string | null;
  description: string | null;
  created_at: number;
  updated_at: number;
};

export type UserRoleRow = {
  user_id: string;
  role_id: string;
  org_id: string;
  created_at: number;
};

export type UserPermissionRow = {
  user_id: string;
  org_id: string;
  resource_id: string;
  action: string;
  created_at: number;
};

export type RolePermissionRow = {
  role_id: string;
  org_id: string;
  resource_id: string;
  action: string;
  created_at: number;
};

// Database schema definition for Tinqer
export type DatabaseSchema = {
  organization: OrganizationRow;
  organization_property: OrganizationPropertyRow;
  user: UserRow;
  user_property: UserPropertyRow;
  role: RoleRow;
  role_property: RolePropertyRow;
  resource: ResourceRow;
  user_role: UserRoleRow;
  user_permission: UserPermissionRow;
  role_permission: RolePermissionRow;
};

// Create the Tinqer schema instance
export const schema = createSchema<DatabaseSchema>();
