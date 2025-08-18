import { graphqlRequest } from "../http-client.js";
import { Result, PermisoConfig } from "../types.js";
import type {
  Organization,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  OrganizationFilter,
  PaginationInput,
  Property,
} from "../generated/types.js";

/**
 * Get an organization by ID
 */
export async function getOrganization(
  config: PermisoConfig,
  id: string,
): Promise<Result<Organization | null, Error>> {
  const query = `
    query GetOrganization($id: ID!) {
      organization(id: $id) {
        id
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

  const result = await graphqlRequest<{ organization: Organization | null }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { id },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.organization };
}

/**
 * List all organizations with optional filtering and pagination
 */
export async function listOrganizations(
  config: PermisoConfig,
  options?: {
    filter?: OrganizationFilter;
    pagination?: PaginationInput;
  },
): Promise<
  Result<
    {
      nodes: Organization[];
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
    query ListOrganizations($filter: OrganizationFilter, $pagination: PaginationInput) {
      organizations(filter: $filter, pagination: $pagination) {
        nodes {
          id
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

  const result = await graphqlRequest<{ organizations: any }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: {
      filter: options?.filter,
      pagination: options?.pagination,
    },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.organizations };
}

/**
 * Get organizations by IDs
 */
export async function getOrganizationsByIds(
  config: PermisoConfig,
  ids: string[],
): Promise<Result<Organization[], Error>> {
  const query = `
    query GetOrganizationsByIds($ids: [ID!]!) {
      organizationsByIds(ids: $ids) {
        id
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

  const result = await graphqlRequest<{ organizationsByIds: Organization[] }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { ids },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.organizationsByIds };
}

/**
 * Create a new organization
 */
export async function createOrganization(
  config: PermisoConfig,
  input: CreateOrganizationInput,
): Promise<Result<Organization, Error>> {
  const mutation = `
    mutation CreateOrganization($input: CreateOrganizationInput!) {
      createOrganization(input: $input) {
        id
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

  const result = await graphqlRequest<{ createOrganization: Organization }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { input },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.createOrganization };
}

/**
 * Update an organization
 */
export async function updateOrganization(
  config: PermisoConfig,
  id: string,
  input: UpdateOrganizationInput,
): Promise<Result<Organization, Error>> {
  const mutation = `
    mutation UpdateOrganization($id: ID!, $input: UpdateOrganizationInput!) {
      updateOrganization(id: $id, input: $input) {
        id
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

  const result = await graphqlRequest<{ updateOrganization: Organization }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { id, input },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.updateOrganization };
}

/**
 * Delete an organization
 */
export async function deleteOrganization(
  config: PermisoConfig,
  id: string,
  safetyKey?: string,
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteOrganization($id: ID!, $safetyKey: String) {
      deleteOrganization(id: $id, safetyKey: $safetyKey)
    }
  `;

  const result = await graphqlRequest<{ deleteOrganization: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { id, safetyKey },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.deleteOrganization };
}

/**
 * Get a specific organization property
 */
export async function getOrganizationProperty(
  config: PermisoConfig,
  orgId: string,
  propertyName: string,
): Promise<Result<Property | null, Error>> {
  const query = `
    query GetOrganizationProperty($orgId: ID!, $propertyName: String!) {
      organizationProperty(orgId: $orgId, propertyName: $propertyName) {
        name
        value
        hidden
        createdAt
      }
    }
  `;

  const result = await graphqlRequest<{
    organizationProperty: Property | null;
  }>({
    endpoint: `${config.endpoint}/graphql`,
    query,
    variables: { orgId, propertyName },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.organizationProperty };
}

/**
 * Set an organization property
 */
export async function setOrganizationProperty(
  config: PermisoConfig,
  orgId: string,
  name: string,
  value: unknown,
  hidden?: boolean,
): Promise<Result<Property, Error>> {
  const mutation = `
    mutation SetOrganizationProperty(
      $orgId: ID!,
      $name: String!,
      $value: JSON,
      $hidden: Boolean
    ) {
      setOrganizationProperty(
        orgId: $orgId,
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

  const result = await graphqlRequest<{ setOrganizationProperty: Property }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { orgId, name, value, hidden },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.setOrganizationProperty };
}

/**
 * Delete an organization property
 */
export async function deleteOrganizationProperty(
  config: PermisoConfig,
  orgId: string,
  name: string,
): Promise<Result<boolean, Error>> {
  const mutation = `
    mutation DeleteOrganizationProperty($orgId: ID!, $name: String!) {
      deleteOrganizationProperty(orgId: $orgId, name: $name)
    }
  `;

  const result = await graphqlRequest<{ deleteOrganizationProperty: boolean }>({
    endpoint: `${config.endpoint}/graphql`,
    query: mutation,
    variables: { orgId, name },
    headers: config.apiKey ? { "x-api-key": config.apiKey } : undefined,
    timeout: config.timeout,
    logger: config.logger,
  });

  if (!result.success) {
    return result;
  }

  return { success: true, data: result.data.deleteOrganizationProperty };
}
