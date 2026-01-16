/**
 * Organization Repository Interface
 * Database-agnostic contract for organization data access
 *
 * Note: Organizations are not RLS-protected - they are globally accessible.
 * The orgId parameter is not used for filtering in most operations.
 */

import type {
  Result,
  PaginationInput,
  Connection,
  PropertyInput,
  Property,
} from "./types.js";

// Organization entity (domain model, not GraphQL)
export type Organization = {
  id: string;
  name: string;
  description: string | null;
  createdAt: number;
  updatedAt: number;
};

// Filter for listing organizations
export type OrganizationFilter = {
  name?: string;
};

// Input for creating an organization
export type CreateOrganizationInput = {
  id: string;
  name: string;
  description?: string;
  properties?: PropertyInput[];
};

// Input for updating an organization
export type UpdateOrganizationInput = {
  name?: string;
  description?: string;
};

export type IOrganizationRepository = {
  // CRUD operations (organizations are not org-scoped)
  create(input: CreateOrganizationInput): Promise<Result<Organization>>;
  getById(orgId: string): Promise<Result<Organization | null>>;
  list(
    filter?: OrganizationFilter,
    pagination?: PaginationInput,
  ): Promise<Result<Connection<Organization>>>;
  update(
    orgId: string,
    input: UpdateOrganizationInput,
  ): Promise<Result<Organization>>;
  delete(orgId: string): Promise<Result<boolean>>;

  // Properties
  getProperties(orgId: string): Promise<Result<Property[]>>;
  getProperty(orgId: string, name: string): Promise<Result<Property | null>>;
  setProperty(
    orgId: string,
    property: PropertyInput,
  ): Promise<Result<Property>>;
  deleteProperty(orgId: string, name: string): Promise<Result<boolean>>;
};
