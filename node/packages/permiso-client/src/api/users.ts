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
  userId: string,
): Promise<Result<User | null, Error>> {
  const query = `
    query GetUser($userId: ID!) {
      user(userId: $userId) {
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
    variables: { userId },
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
    query ListUsers($filter: UserFilter, $pagination: PaginationInput) {
      users(filter: $filter, pagination: $pagination) {
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

  const result = await graphqlRequest<{
    users: {
      nodes: User[];
      totalCount: number;
      pageInfo: {
        hasNextPage: boolean;
        hasPreviousPage: boolean;
        startCursor?: string;
        endCursor?: string;
      };
    };
  }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: {
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
  ids: string[],
): Promise<Result<User[], Error>> {
  const query = `
    query GetUsersByIds($ids: [ID!]!) {
      usersByIds(ids: $ids) {
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
    variables: { ids },
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
  userId: string,
  input: UpdateUserInput,
): Promise<Result<User, Error>> {
  const mutation = `
    mutation UpdateUser($userId: ID!, $input: UpdateUserInput!) {
      updateUser(userId: $userId, input: $input) {
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
    variables: { userId, input },
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
  userId: string,
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteUser($userId: ID!) {
      deleteUser(userId: $userId)
    }
  `;

  const result = await graphqlRequest<{ deleteUser: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { userId },
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
  userId: string,
  propertyName: string,
): Promise<Result<Property | null, Error>> {
  const query = `
    query GetUserProperty($userId: ID!, $propertyName: String!) {
      userProperty(userId: $userId, propertyName: $propertyName) {
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
    variables: { userId, propertyName },
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
  userId: string,
  name: string,
  value: unknown,
  hidden?: boolean,
): Promise<Result<Property, Error>> {
  const mutation = `
    mutation SetUserProperty(
      $userId: ID!,
      $name: String!,
      $value: JSON,
      $hidden: Boolean
    ) {
      setUserProperty(
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
    variables: { userId, name, value, hidden },
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
  userId: string,
  name: string,
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteUserProperty($userId: ID!, $name: String!) {
      deleteUserProperty(userId: $userId, name: $name)
    }
  `;

  const result = await graphqlRequest<{ deleteUserProperty: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { userId, name },
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
  userId: string,
  roleId: string,
): Promise<Result<User, Error>> {
  const mutation = `
    mutation AssignUserRole($userId: ID!, $roleId: ID!) {
      assignUserRole(userId: $userId, roleId: $roleId) {
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
    variables: { userId, roleId },
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
  userId: string,
  roleId: string,
): Promise<Result<User, Error>> {
  const mutation = `
    mutation UnassignUserRole($userId: ID!, $roleId: ID!) {
      unassignUserRole(userId: $userId, roleId: $roleId) {
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
    variables: { userId, roleId },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.unassignUserRole };
}
