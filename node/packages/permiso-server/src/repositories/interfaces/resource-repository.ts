/**
 * Resource Repository Interface
 * Database-agnostic contract for resource data access
 */

import type { Result, PaginationInput, Connection } from "./types.js";

// Resource entity (domain model, not GraphQL)
export type Resource = {
  id: string; // This is the resource path, e.g., "/india/data/legal"
  orgId: string;
  name: string | null;
  description: string | null;
  createdAt: number;
  updatedAt: number;
};

// Filter for listing resources
export type ResourceFilter = {
  idPrefix?: string; // Filter by resource path prefix
};

// Input for creating a resource
export type CreateResourceInput = {
  id: string; // The resource path
  name?: string;
  description?: string;
};

// Input for updating a resource
export type UpdateResourceInput = {
  name?: string;
  description?: string;
};

export type IResourceRepository = {
  // CRUD operations
  create(orgId: string, input: CreateResourceInput): Promise<Result<Resource>>;
  getById(orgId: string, resourceId: string): Promise<Result<Resource | null>>;
  list(
    orgId: string,
    filter?: ResourceFilter,
    pagination?: PaginationInput,
  ): Promise<Result<Connection<Resource>>>;
  listByOrg(
    orgId: string,
    pagination?: PaginationInput,
  ): Promise<Result<Connection<Resource>>>;
  listByIdPrefix(orgId: string, idPrefix: string): Promise<Result<Resource[]>>;
  update(
    orgId: string,
    resourceId: string,
    input: UpdateResourceInput,
  ): Promise<Result<Resource>>;
  delete(orgId: string, resourceId: string): Promise<Result<boolean>>;
  deleteByIdPrefix(orgId: string, idPrefix: string): Promise<Result<number>>; // Returns count deleted
};
