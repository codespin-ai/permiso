import { scalarResolvers } from "./scalars.js";

import {
  getOrganizationResolver,
  getOrganizationsResolver,
  createOrganizationResolver,
  updateOrganizationResolver,
  deleteOrganizationResolver,
  getOrganizationPropertyResolver,
  setOrganizationPropertyResolver,
  deleteOrganizationPropertyResolver,
  organizationFieldResolvers,
} from "./organization/index.js";

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
  userFieldResolvers,
} from "./user/index.js";

import {
  getRoleResolver,
  getRolesResolver,
  createRoleResolver,
  updateRoleResolver,
  deleteRoleResolver,
  getRolePropertyResolver,
  setRolePropertyResolver,
  deleteRolePropertyResolver,
  roleFieldResolvers,
} from "./role/index.js";

import {
  getResourceResolver,
  getResourcesResolver,
  resourcesByIdPrefixResolver,
  createResourceResolver,
  updateResourceResolver,
  deleteResourceResolver,
  resourceFieldResolvers,
} from "./resource/index.js";

import {
  grantUserPermissionResolver,
  revokeUserPermissionResolver,
  getUserPermissionsResolver,
  grantRolePermissionResolver,
  revokeRolePermissionResolver,
  getRolePermissionsResolver,
  getEffectivePermissionsResolver,
  getEffectivePermissionsByPrefixResolver,
  hasPermissionResolver,
  permissionFieldResolvers,
} from "./permission/index.js";

function mergeResolvers(...resolvers: unknown[]) {
  const merged: Record<string, unknown> = {
    Query: {},
    Mutation: {},
  };

  for (const resolver of resolvers) {
    const resolverObj = resolver as Record<string, unknown>;
    if (resolverObj.Query) {
      Object.assign(merged.Query as Record<string, unknown>, resolverObj.Query);
    }
    if (resolverObj.Mutation) {
      Object.assign(
        merged.Mutation as Record<string, unknown>,
        resolverObj.Mutation,
      );
    }
    // Copy field resolvers (like User, Organization, etc.)
    for (const key of Object.keys(resolverObj)) {
      if (key !== "Query" && key !== "Mutation") {
        merged[key] = resolverObj[key];
      }
    }
  }

  return merged;
}

export const resolvers = mergeResolvers(
  // Scalar resolvers
  scalarResolvers,

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
  resourcesByIdPrefixResolver,
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
  hasPermissionResolver,
  permissionFieldResolvers,
);
