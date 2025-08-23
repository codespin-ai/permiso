import { graphqlRequest } from "../http-client.js";
import { Result, PermisoConfig } from "../types.js";
import { buildHeaders } from "./utils.js";
import type {
  User,
  CreateUserInput,
  UpdateUserInput,
  UserFilter,
  PaginationInput,
  Property,
} from "../generated/types.js";

/**
 * Get a user by organization and user ID
 */
export async function getUser(
  config: PermisoConfig,
  orgId: string,
  userId: string,
): Promise<Result<User | null, Error>> {
  const query = `
    query GetUser($orgId: ID!, $userId: ID!) {
      user(orgId: $orgId, userId: $userId) {
        id
        orgId
        identityProvider
        identityProviderUserId
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
        roles {
          id
          name
          description
          createdAt
          updatedAt
        }
      }
    }
  `;

  const result = await graphqlRequest<{ user: User | null }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { orgId, userId },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.user };
}

/**
 * List users in an organization with optional filtering and pagination
 */
export async function listUsers(
  config: PermisoConfig,
  orgId: string,
  options?: {
    filter?: UserFilter;
    pagination?: PaginationInput;
  },
): Promise<
  Result<
    {
      nodes: User[];
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: string;
        endCursor?: string;
      };
    },
    Error
  >
> {
  const query = `
    query ListUsers($orgId: ID!, $filter: UserFilter, $pagination: PaginationInput) {
      users(orgId: $orgId, filter: $filter, pagination: $pagination) {
        nodes {
          id
          orgId
          identityProvider
          identityProviderUserId
          properties {
            name
            value
            hidden
            createdAt
          }
          createdAt
          updatedAt
          roles {
            id
            name
            description
          }
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

  const result = await graphqlRequest<{ users: any }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: {
      orgId,
      filter: options?.filter,
      pagination: options?.pagination,
    },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.users };
}

/**
 * Get users by IDs
 */
export async function getUsersByIds(
  config: PermisoConfig,
  orgId: string,
  ids: string[],
): Promise<Result<User[], Error>> {
  const query = `
    query GetUsersByIds($orgId: ID!, $ids: [ID!]!) {
      usersByIds(orgId: $orgId, ids: $ids) {
        id
        orgId
        identityProvider
        identityProviderUserId
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
        roles {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ usersByIds: User[] }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { orgId, ids },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.usersByIds };
}

/**
 * Get users by identity provider and user ID
 */
export async function getUsersByIdentity(
  config: PermisoConfig,
  identityProvider: string,
  identityProviderUserId: string,
): Promise<Result<User[], Error>> {
  const query = `
    query GetUsersByIdentity($identityProvider: String!, $identityProviderUserId: String!) {
      usersByIdentity(
        identityProvider: $identityProvider,
        identityProviderUserId: $identityProviderUserId
      ) {
        id
        orgId
        identityProvider
        identityProviderUserId
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
        roles {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ usersByIdentity: User[] }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { identityProvider, identityProviderUserId },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.usersByIdentity };
}

/**
 * Create a new user
 */
export async function createUser(
  config: PermisoConfig,
  input: CreateUserInput,
): Promise<Result<User, Error>> {
  const mutation = `
    mutation CreateUser($input: CreateUserInput!) {
      createUser(input: $input) {
        id
        orgId
        identityProvider
        identityProviderUserId
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
        roles {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ createUser: User }>({
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

  return { success: true, data: result.data.createUser };
}

/**
 * Update a user
 */
export async function updateUser(
  config: PermisoConfig,
  orgId: string,
  userId: string,
  input: UpdateUserInput,
): Promise<Result<User, Error>> {
  const mutation = `
    mutation UpdateUser($orgId: ID!, $userId: ID!, $input: UpdateUserInput!) {
      updateUser(orgId: $orgId, userId: $userId, input: $input) {
        id
        orgId
        identityProvider
        identityProviderUserId
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
        roles {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ updateUser: User }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { orgId, userId, input },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.updateUser };
}

/**
 * Delete a user
 */
export async function deleteUser(
  config: PermisoConfig,
  orgId: string,
  userId: string,
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteUser($orgId: ID!, $userId: ID!) {
      deleteUser(orgId: $orgId, userId: $userId)
    }
  `;

  const result = await graphqlRequest<{ deleteUser: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { orgId, userId },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.deleteUser };
}

/**
 * Get a specific user property
 */
export async function getUserProperty(
  config: PermisoConfig,
  orgId: string,
  userId: string,
  propertyName: string,
): Promise<Result<Property | null, Error>> {
  const query = `
    query GetUserProperty($orgId: ID!, $userId: ID!, $propertyName: String!) {
      userProperty(orgId: $orgId, userId: $userId, propertyName: $propertyName) {
        name
        value
        hidden
        createdAt
      }
    }
  `;

  const result = await graphqlRequest<{ userProperty: Property | null }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { orgId, userId, propertyName },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.userProperty };
}

/**
 * Set a user property
 */
export async function setUserProperty(
  config: PermisoConfig,
  orgId: string,
  userId: string,
  name: string,
  value: unknown,
  hidden?: boolean,
): Promise<Result<Property, Error>> {
  const mutation = `
    mutation SetUserProperty(
      $orgId: ID!,
      $userId: ID!,
      $name: String!,
      $value: JSON,
      $hidden: Boolean
    ) {
      setUserProperty(
        orgId: $orgId,
        userId: $userId,
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

  const result = await graphqlRequest<{ setUserProperty: Property }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { orgId, userId, name, value, hidden },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.setUserProperty };
}

/**
 * Delete a user property
 */
export async function deleteUserProperty(
  config: PermisoConfig,
  orgId: string,
  userId: string,
  name: string,
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteUserProperty($orgId: ID!, $userId: ID!, $name: String!) {
      deleteUserProperty(orgId: $orgId, userId: $userId, name: $name)
    }
  `;

  const result = await graphqlRequest<{ deleteUserProperty: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { orgId, userId, name },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.deleteUserProperty };
}

/**
 * Assign a role to a user
 */
export async function assignUserRole(
  config: PermisoConfig,
  orgId: string,
  userId: string,
  roleId: string,
): Promise<Result<User, Error>> {
  const mutation = `
    mutation AssignUserRole($orgId: ID!, $userId: ID!, $roleId: ID!) {
      assignUserRole(orgId: $orgId, userId: $userId, roleId: $roleId) {
        id
        orgId
        identityProvider
        identityProviderUserId
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
        roles {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ assignUserRole: User }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { orgId, userId, roleId },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.assignUserRole };
}

/**
 * Unassign a role from a user
 */
export async function unassignUserRole(
  config: PermisoConfig,
  orgId: string,
  userId: string,
  roleId: string,
): Promise<Result<User, Error>> {
  const mutation = `
    mutation UnassignUserRole($orgId: ID!, $userId: ID!, $roleId: ID!) {
      unassignUserRole(orgId: $orgId, userId: $userId, roleId: $roleId) {
        id
        orgId
        identityProvider
        identityProviderUserId
        properties {
          name
          value
          hidden
          createdAt
        }
        createdAt
        updatedAt
        roles {
          id
          name
          description
        }
      }
    }
  `;

  const result = await graphqlRequest<{ unassignUserRole: User }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { orgId, userId, roleId },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.unassignUserRole };
}
