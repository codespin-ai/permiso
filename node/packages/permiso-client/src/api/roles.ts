import { graphqlRequest } from '../http-client.js';
import { Result, PermisoConfig } from '../types.js';
import type {
  Role,
  CreateRoleInput,
  UpdateRoleInput,
  RoleFilter,
  PaginationInput,
  Property
} from '../generated/types.js';

/**
 * Get a role by organization and role ID
 */
export async function getRole(
  config: PermisoConfig,
  orgId: string,
  roleId: string
): Promise<Result<Role | null, Error>> {
  const query = `
    query GetRole($orgId: ID!, $roleId: ID!) {
      role(orgId: $orgId, roleId: $roleId) {
        id
        orgId
        name
        description
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ role: Role | null }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query,
      variables: { orgId, roleId },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.role };
}

/**
 * List roles in an organization with optional filtering and pagination
 */
export async function listRoles(
  config: PermisoConfig,
  orgId: string,
  options?: {
    filter?: RoleFilter;
    pagination?: PaginationInput;
  }
): Promise<Result<{
  nodes: Role[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}, Error>> {
  const query = `
    query ListRoles($orgId: ID!, $filter: RoleFilter, $pagination: PaginationInput) {
      roles(orgId: $orgId, filter: $filter, pagination: $pagination) {
        nodes {
          id
          orgId
          name
          description
          properties {
            name
            value
            hidden
            createdAt
          }
          createdAt
          updatedAt
        }
        totalCount
        pageInfo {
          hasNextPage
          hasPreviousPage
          startCursor
          endCursor
        }
      }
    }
  `;

  const result = await graphqlRequest<{ roles: any }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query,
      variables: {
        orgId,
        filter: options?.filter,
        pagination: options?.pagination
      },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.roles };
}

/**
 * Get roles by IDs
 */
export async function getRolesByIds(
  config: PermisoConfig,
  orgId: string,
  ids: string[]
): Promise<Result<Role[], Error>> {
  const query = `
    query GetRolesByIds($orgId: ID!, $ids: [ID!]!) {
      rolesByIds(orgId: $orgId, ids: $ids) {
        id
        orgId
        name
        description
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ rolesByIds: Role[] }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query,
      variables: { orgId, ids },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.rolesByIds };
}

/**
 * Create a new role
 */
export async function createRole(
  config: PermisoConfig,
  input: CreateRoleInput
): Promise<Result<Role, Error>> {
  const mutation = `
    mutation CreateRole($input: CreateRoleInput!) {
      createRole(input: $input) {
        id
        orgId
        name
        description
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ createRole: Role }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query: mutation,
      variables: { input },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.createRole };
}

/**
 * Update a role
 */
export async function updateRole(
  config: PermisoConfig,
  orgId: string,
  roleId: string,
  input: UpdateRoleInput
): Promise<Result<Role, Error>> {
  const mutation = `
    mutation UpdateRole($orgId: ID!, $roleId: ID!, $input: UpdateRoleInput!) {
      updateRole(orgId: $orgId, roleId: $roleId, input: $input) {
        id
        orgId
        name
        description
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ updateRole: Role }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query: mutation,
      variables: { orgId, roleId, input },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.updateRole };
}

/**
 * Delete a role
 */
export async function deleteRole(
  config: PermisoConfig,
  orgId: string,
  roleId: string
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteRole($orgId: ID!, $roleId: ID!) {
      deleteRole(orgId: $orgId, roleId: $roleId)
    }
  `;

  const result = await graphqlRequest<{ deleteRole: boolean }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query: mutation,
      variables: { orgId, roleId },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.deleteRole };
}

/**
 * Get a specific role property
 */
export async function getRoleProperty(
  config: PermisoConfig,
  orgId: string,
  roleId: string,
  propertyName: string
): Promise<Result<Property | null, Error>> {
  const query = `
    query GetRoleProperty($orgId: ID!, $roleId: ID!, $propertyName: String!) {
      roleProperty(orgId: $orgId, roleId: $roleId, propertyName: $propertyName) {
        name
        value
        hidden
        createdAt
      }
    }
  `;

  const result = await graphqlRequest<{ roleProperty: Property | null }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query,
      variables: { orgId, roleId, propertyName },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.roleProperty };
}

/**
 * Set a role property
 */
export async function setRoleProperty(
  config: PermisoConfig,
  orgId: string,
  roleId: string,
  name: string,
  value: unknown,
  hidden?: boolean
): Promise<Result<Property, Error>> {
  const mutation = `
    mutation SetRoleProperty(
      $orgId: ID!,
      $roleId: ID!,
      $name: String!,
      $value: JSON,
      $hidden: Boolean
    ) {
      setRoleProperty(
        orgId: $orgId,
        roleId: $roleId,
        name: $name,
        value: $value,
        hidden: $hidden
      ) {
        name
        value
        hidden
        createdAt
      }
    }
  `;

  const result = await graphqlRequest<{ setRoleProperty: Property }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query: mutation,
      variables: { orgId, roleId, name, value, hidden },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.setRoleProperty };
}

/**
 * Delete a role property
 */
export async function deleteRoleProperty(
  config: PermisoConfig,
  orgId: string,
  roleId: string,
  name: string
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteRoleProperty($orgId: ID!, $roleId: ID!, $name: String!) {
      deleteRoleProperty(orgId: $orgId, roleId: $roleId, name: $name)
    }
  `;

  const result = await graphqlRequest<{ deleteRoleProperty: boolean }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query: mutation,
      variables: { orgId, roleId, name },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.deleteRoleProperty };
}