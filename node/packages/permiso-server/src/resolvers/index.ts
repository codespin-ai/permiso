import {
  getOrganizationResolver,
  getOrganizationsResolver,
  createOrganizationResolver,
  updateOrganizationResolver,
  deleteOrganizationResolver,
  getOrganizationPropertyResolver,
  setOrganizationPropertyResolver,
  deleteOrganizationPropertyResolver,
  organizationFieldResolvers
} from './organization/index.js';

import {
  getUserResolver,
  getUsersResolver,
  getUsersByIdentityResolver,
  createUserResolver,
  updateUserResolver,
  deleteUserResolver,
  getUserPropertyResolver,
  setUserPropertyResolver,
  deleteUserPropertyResolver,
  assignUserRoleResolver,
  unassignUserRoleResolver,
  userFieldResolvers
} from './user/index.js';

import {
  getRoleResolver,
  getRolesResolver,
  createRoleResolver,
  updateRoleResolver,
  deleteRoleResolver,
  getRolePropertyResolver,
  setRolePropertyResolver,
  deleteRolePropertyResolver,
  roleFieldResolvers
} from './role/index.js';

import {
  getResourceResolver,
  getResourcesResolver,
  createResourceResolver,
  updateResourceResolver,
  deleteResourceResolver,
  resourceFieldResolvers
} from './resource/index.js';

import {
  grantUserPermissionResolver,
  revokeUserPermissionResolver,
  getUserPermissionsResolver,
  grantRolePermissionResolver,
  revokeRolePermissionResolver,
  getRolePermissionsResolver,
  getEffectivePermissionsResolver,
  getEffectivePermissionsByPrefixResolver,
  hasPermissionResolver
} from './permission/index.js';

function mergeResolvers(...resolvers: any[]) {
  const merged: any = {
    Query: {},
    Mutation: {}
  };

  for (const resolver of resolvers) {
    if (resolver.Query) {
      Object.assign(merged.Query, resolver.Query);
    }
    if (resolver.Mutation) {
      Object.assign(merged.Mutation, resolver.Mutation);
    }
    // Copy field resolvers (like User, Organization, etc.)
    for (const key of Object.keys(resolver)) {
      if (key !== 'Query' && key !== 'Mutation') {
        merged[key] = resolver[key];
      }
    }
  }

  return merged;
}

export const resolvers = mergeResolvers(
  // Organization resolvers
  getOrganizationResolver,
  getOrganizationsResolver,
  createOrganizationResolver,
  updateOrganizationResolver,
  deleteOrganizationResolver,
  getOrganizationPropertyResolver,
  setOrganizationPropertyResolver,
  deleteOrganizationPropertyResolver,
  organizationFieldResolvers,

  // User resolvers
  getUserResolver,
  getUsersResolver,
  getUsersByIdentityResolver,
  createUserResolver,
  updateUserResolver,
  deleteUserResolver,
  getUserPropertyResolver,
  setUserPropertyResolver,
  deleteUserPropertyResolver,
  assignUserRoleResolver,
  unassignUserRoleResolver,
  userFieldResolvers,

  // Role resolvers
  getRoleResolver,
  getRolesResolver,
  createRoleResolver,
  updateRoleResolver,
  deleteRoleResolver,
  getRolePropertyResolver,
  setRolePropertyResolver,
  deleteRolePropertyResolver,
  roleFieldResolvers,

  // Resource resolvers
  getResourceResolver,
  getResourcesResolver,
  createResourceResolver,
  updateResourceResolver,
  deleteResourceResolver,
  resourceFieldResolvers,

  // Permission resolvers
  grantUserPermissionResolver,
  revokeUserPermissionResolver,
  getUserPermissionsResolver,
  grantRolePermissionResolver,
  revokeRolePermissionResolver,
  getRolePermissionsResolver,
  getEffectivePermissionsResolver,
  getEffectivePermissionsByPrefixResolver,
  hasPermissionResolver
);