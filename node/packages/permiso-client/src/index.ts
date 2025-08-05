/**
 * Permiso Client - A TypeScript client for the Permiso RBAC API
 * 
 * This package provides a complete client SDK for interacting with the Permiso
 * Role-Based Access Control system. It abstracts away the GraphQL layer and
 * provides simple function-based APIs for all operations.
 */

// Export types
export type { PermisoConfig, Logger, Result, GraphQLError, GraphQLResponse } from './types.js';
export { success, failure } from './types.js';

// Export generated types
export type {
  // Core entities
  Organization,
  User,
  Role,
  Resource,
  Property,
  
  // Permission types
  Permission,
  UserPermission,
  RolePermission,
  EffectivePermission,
  
  // Input types
  CreateOrganizationInput,
  UpdateOrganizationInput,
  CreateUserInput,
  UpdateUserInput,
  CreateRoleInput,
  UpdateRoleInput,
  CreateResourceInput,
  UpdateResourceInput,
  PropertyInput,
  GrantUserPermissionInput,
  GrantRolePermissionInput,
  
  // Filter types
  OrganizationFilter,
  UserFilter,
  RoleFilter,
  ResourceFilter,
  PropertyFilter,
  
  // Pagination types
  PaginationInput,
  SortDirection,
  
  // Connection types
  OrganizationConnection,
  UserConnection,
  RoleConnection,
  ResourceConnection,
  PageInfo
} from './generated/types.js';

// Export organization APIs
export {
  getOrganization,
  listOrganizations,
  getOrganizationsByIds,
  createOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationProperty,
  setOrganizationProperty,
  deleteOrganizationProperty
} from './api/organizations.js';

// Export user APIs
export {
  getUser,
  listUsers,
  getUsersByIds,
  getUsersByIdentity,
  createUser,
  updateUser,
  deleteUser,
  getUserProperty,
  setUserProperty,
  deleteUserProperty,
  assignUserRole,
  unassignUserRole
} from './api/users.js';

// Export role APIs
export {
  getRole,
  listRoles,
  getRolesByIds,
  createRole,
  updateRole,
  deleteRole,
  getRoleProperty,
  setRoleProperty,
  deleteRoleProperty
} from './api/roles.js';

// Export resource APIs
export {
  getResource,
  listResources,
  getResourcesByIdPrefix,
  createResource,
  updateResource,
  deleteResource
} from './api/resources.js';

// Export permission APIs
export {
  hasPermission,
  getUserPermissions,
  getRolePermissions,
  getEffectivePermissions,
  getEffectivePermissionsByPrefix,
  grantUserPermission,
  revokeUserPermission,
  grantRolePermission,
  revokeRolePermission
} from './api/permissions.js';