import { graphqlRequest } from '../http-client.js';
import { Result, PermisoConfig } from '../types.js';
import type {
  Resource,
  CreateResourceInput,
  UpdateResourceInput,
  ResourceFilter,
  PaginationInput
} from '../generated/types.js';

/**
 * Get a resource by organization and resource ID
 */
export async function getResource(
  config: PermisoConfig,
  orgId: string,
  resourceId: string
): Promise<Result<Resource | null, Error>> {
  const query = `
    query GetResource($orgId: ID!, $resourceId: ID!) {
      resource(orgId: $orgId, resourceId: $resourceId) {
        id
        orgId
        name
        description
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ resource: Resource | null }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query,
      variables: { orgId, resourceId },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.resource };
}

/**
 * List resources in an organization with optional filtering and pagination
 */
export async function listResources(
  config: PermisoConfig,
  orgId: string,
  options?: {
    filter?: ResourceFilter;
    pagination?: PaginationInput;
  }
): Promise<Result<{
  nodes: Resource[];
  totalCount: number;
  pageInfo: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor?: string;
    endCursor?: string;
  };
}, Error>> {
  const query = `
    query ListResources($orgId: ID!, $filter: ResourceFilter, $pagination: PaginationInput) {
      resources(orgId: $orgId, filter: $filter, pagination: $pagination) {
        nodes {
          id
          orgId
          name
          description
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

  const result = await graphqlRequest<{ resources: any }>(
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

  return { success: true, data: result.data.resources };
}

/**
 * Get resources by ID prefix
 */
export async function getResourcesByIdPrefix(
  config: PermisoConfig,
  orgId: string,
  idPrefix: string
): Promise<Result<Resource[], Error>> {
  const query = `
    query GetResourcesByIdPrefix($orgId: ID!, $idPrefix: String!) {
      resourcesByIdPrefix(orgId: $orgId, idPrefix: $idPrefix) {
        id
        orgId
        name
        description
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ resourcesByIdPrefix: Resource[] }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query,
      variables: { orgId, idPrefix },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.resourcesByIdPrefix };
}

/**
 * Create a new resource
 */
export async function createResource(
  config: PermisoConfig,
  input: CreateResourceInput
): Promise<Result<Resource, Error>> {
  const mutation = `
    mutation CreateResource($input: CreateResourceInput!) {
      createResource(input: $input) {
        id
        orgId
        name
        description
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ createResource: Resource }>(
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

  return { success: true, data: result.data.createResource };
}

/**
 * Update a resource
 */
export async function updateResource(
  config: PermisoConfig,
  orgId: string,
  resourceId: string,
  input: UpdateResourceInput
): Promise<Result<Resource, Error>> {
  const mutation = `
    mutation UpdateResource($orgId: ID!, $resourceId: ID!, $input: UpdateResourceInput!) {
      updateResource(orgId: $orgId, resourceId: $resourceId, input: $input) {
        id
        orgId
        name
        description
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ updateResource: Resource }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query: mutation,
      variables: { orgId, resourceId, input },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.updateResource };
}

/**
 * Delete a resource
 */
export async function deleteResource(
  config: PermisoConfig,
  orgId: string,
  resourceId: string
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteResource($orgId: ID!, $resourceId: ID!) {
      deleteResource(orgId: $orgId, resourceId: $resourceId)
    }
  `;

  const result = await graphqlRequest<{ deleteResource: boolean }>(
    {
      endpoint: `${config.endpoint}/graphql`,
      query: mutation,
      variables: { orgId, resourceId },
      headers: config.apiKey ? { 'x-api-key': config.apiKey } : undefined,
      timeout: config.timeout,
      logger: config.logger
    }
  );

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.deleteResource };
}