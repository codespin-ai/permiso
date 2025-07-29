import { organizationResolvers } from './organization-resolvers.js';
import { userResolvers } from './user-resolvers.js';
import { roleResolvers } from './role-resolvers.js';
import { resourceResolvers } from './resource-resolvers.js';
import { permissionResolvers } from './permission-resolvers.js';

export const resolvers = {
  Query: {
    ...organizationResolvers.Query,
    ...userResolvers.Query,
    ...roleResolvers.Query,
    ...resourceResolvers.Query,
    ...permissionResolvers.Query
  },
  Mutation: {
    ...organizationResolvers.Mutation,
    ...userResolvers.Mutation,
    ...roleResolvers.Mutation,
    ...resourceResolvers.Mutation,
    ...permissionResolvers.Mutation
  },
  Organization: organizationResolvers.Organization,
  User: userResolvers.User,
  Role: roleResolvers.Role,
  Resource: resourceResolvers.Resource,
  UserPermission: permissionResolvers.UserPermission,
  RolePermission: permissionResolvers.RolePermission
};