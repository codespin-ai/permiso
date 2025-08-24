import { graphqlRequest } from "../http-client.js";
import { Result, PermisoConfig } from "../types.js";
import { buildHeaders } from "./utils.js";
import type {
  UserPermission,
  RolePermission,
  EffectivePermission,
  GrantUserPermissionInput,
  GrantRolePermissionInput,
} from "../generated/types.js";

/**
 * Check if a user has permission for a specific resource and action
 */
export async function hasPermission(
  config: PermisoConfig,
  params: {
    userId: string;
    resourceId: string;
    action: string;
  },
): Promise<Result<boolean, Error>> {
  const query = `
    query HasPermission(
      $userId: ID!,
      $resourceId: String!,
      $action: String!
    ) {
      hasPermission(
        userId: $userId,
        resourceId: $resourceId,
        action: $action
      )
    }
  `;

  const result = await graphqlRequest<{ hasPermission: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: params,
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.hasPermission };
}

/**
 * Get user permissions
 */
export async function getUserPermissions(
  config: PermisoConfig,
  params: {
    userId: string;
    resourceId?: string;
    action?: string;
  },
): Promise<Result<UserPermission[], Error>> {
  const query = `
    query GetUserPermissions(
      $userId: ID!,
      $resourceId: String,
      $action: String
    ) {
      userPermissions(
        userId: $userId,
        resourceId: $resourceId,
        action: $action
      ) {
        userId
        resourceId
        action
        createdAt
        user {
          id
          identityProvider
          identityProviderUserId
        }
        resource {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ userPermissions: UserPermission[] }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: params,
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.userPermissions };
}

/**
 * Get role permissions
 */
export async function getRolePermissions(
  config: PermisoConfig,
  params: {
    roleId: string;
    resourceId?: string;
    action?: string;
  },
): Promise<Result<RolePermission[], Error>> {
  const query = `
    query GetRolePermissions(
      $roleId: ID!,
      $resourceId: String,
      $action: String
    ) {
      rolePermissions(
        roleId: $roleId,
        resourceId: $resourceId,
        action: $action
      ) {
        roleId
        resourceId
        action
        createdAt
        role {
          id
          name
          description
        }
        resource {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ rolePermissions: RolePermission[] }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: params,
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.rolePermissions };
}

/**
 * Get effective permissions for a user on a resource
 */
export async function getEffectivePermissions(
  config: PermisoConfig,
  params: {
    userId: string;
    resourceId: string;
    action?: string;
  },
): Promise<Result<EffectivePermission[], Error>> {
  const query = `
    query GetEffectivePermissions(
      $userId: ID!,
      $resourceId: String!,
      $action: String
    ) {
      effectivePermissions(
        userId: $userId,
        resourceId: $resourceId,
        action: $action
      ) {
        resourceId
        action
        source
        sourceId
        createdAt
      }
    }
  `;

  const result = await graphqlRequest<{
    effectivePermissions: EffectivePermission[];
  }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: params,
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.effectivePermissions };
}

/**
 * Get effective permissions by resource ID prefix
 */
export async function getEffectivePermissionsByPrefix(
  config: PermisoConfig,
  params: {
    userId: string;
    resourceIdPrefix: string;
    action?: string;
  },
): Promise<Result<EffectivePermission[], Error>> {
  const query = `
    query GetEffectivePermissionsByPrefix(
      $userId: ID!,
      $resourceIdPrefix: String!,
      $action: String
    ) {
      effectivePermissionsByPrefix(
        userId: $userId,
        resourceIdPrefix: $resourceIdPrefix,
        action: $action
      ) {
        resourceId
        action
        source
        sourceId
        createdAt
      }
    }
  `;

  const result = await graphqlRequest<{
    effectivePermissionsByPrefix: EffectivePermission[];
  }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: params,
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.effectivePermissionsByPrefix };
}

/**
 * Grant permission to a user
 */
export async function grantUserPermission(
  config: PermisoConfig,
  input: GrantUserPermissionInput,
): Promise<Result<UserPermission, Error>> {
  const mutation = `
    mutation GrantUserPermission($input: GrantUserPermissionInput!) {
      grantUserPermission(input: $input) {
        userId
        resourceId
        action
        createdAt
        user {
          id
          identityProvider
          identityProviderUserId
        }
        resource {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ grantUserPermission: UserPermission }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { input },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.grantUserPermission };
}

/**
 * Revoke permission from a user
 */
export async function revokeUserPermission(
  config: PermisoConfig,
  params: {
    userId: string;
    resourceId: string;
    action: string;
  },
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation RevokeUserPermission(
      $userId: ID!,
      $resourceId: ID!,
      $action: String!
    ) {
      revokeUserPermission(
        userId: $userId,
        resourceId: $resourceId,
        action: $action
      )
    }
  `;

  const result = await graphqlRequest<{ revokeUserPermission: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: params,
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.revokeUserPermission };
}

/**
 * Grant permission to a role
 */
export async function grantRolePermission(
  config: PermisoConfig,
  input: GrantRolePermissionInput,
): Promise<Result<RolePermission, Error>> {
  const mutation = `
    mutation GrantRolePermission($input: GrantRolePermissionInput!) {
      grantRolePermission(input: $input) {
        roleId
        resourceId
        action
        createdAt
        role {
          id
          name
          description
        }
        resource {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ grantRolePermission: RolePermission }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { input },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.grantRolePermission };
}

/**
 * Revoke permission from a role
 */
export async function revokeRolePermission(
  config: PermisoConfig,
  params: {
    roleId: string;
    resourceId: string;
    action: string;
  },
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation RevokeRolePermission(
      $roleId: ID!,
      $resourceId: ID!,
      $action: String!
    ) {
      revokeRolePermission(
        roleId: $roleId,
        resourceId: $resourceId,
        action: $action
      )
    }
  `;

  const result = await graphqlRequest<{ revokeRolePermission: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: params,
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.revokeRolePermission };
}
