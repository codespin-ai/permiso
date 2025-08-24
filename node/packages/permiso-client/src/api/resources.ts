import { graphqlRequest } from "../http-client.js";
import { Result, PermisoConfig } from "../types.js";
import { buildHeaders } from "./utils.js";
import type {
  Resource,
  CreateResourceInput,
  UpdateResourceInput,
  ResourceFilter,
  PaginationInput,
} from "../generated/types.js";

/**
 * Get a resource by organization and resource ID
 */
export async function getResource(
  config: PermisoConfig,
  resourceId: string,
): Promise<Result<Resource | null, Error>> {
  const query = `
    query GetResource($resourceId: ID!) {
      resource(resourceId: $resourceId) {
        id
        orgId
        name
        description
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ resource: Resource | null }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { resourceId },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

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
  options?: {
    filter?: ResourceFilter;
    pagination?: PaginationInput;
  },
): Promise<
  Result<
    {
      nodes: Resource[];
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
    query ListResources($filter: ResourceFilter, $pagination: PaginationInput) {
      resources(filter: $filter, pagination: $pagination) {
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

  const result = await graphqlRequest<{ resources: any }>({
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

  return { success: true, data: result.data.resources };
}

/**
 * Get resources by ID prefix
 */
export async function getResourcesByIdPrefix(
  config: PermisoConfig,
  idPrefix: string,
): Promise<Result<Resource[], Error>> {
  const query = `
    query GetResourcesByIdPrefix($idPrefix: String!) {
      resourcesByIdPrefix(idPrefix: $idPrefix) {
        id
        orgId
        name
        description
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ resourcesByIdPrefix: Resource[] }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { idPrefix },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

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
  input: CreateResourceInput,
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

  const result = await graphqlRequest<{ createResource: Resource }>({
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

  return { success: true, data: result.data.createResource };
}

/**
 * Update a resource
 */
export async function updateResource(
  config: PermisoConfig,
  resourceId: string,
  input: UpdateResourceInput,
): Promise<Result<Resource, Error>> {
  const mutation = `
    mutation UpdateResource($resourceId: ID!, $input: UpdateResourceInput!) {
      updateResource(resourceId: $resourceId, input: $input) {
        id
        orgId
        name
        description
        createdAt
        updatedAt
      }
    }
  `;

  const result = await graphqlRequest<{ updateResource: Resource }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { resourceId, input },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

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
  resourceId: string,
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteResource($resourceId: ID!) {
      deleteResource(resourceId: $resourceId)
    }
  `;

  const result = await graphqlRequest<{ deleteResource: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { resourceId },
    headers: buildHeaders(config),
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.deleteResource };
}
