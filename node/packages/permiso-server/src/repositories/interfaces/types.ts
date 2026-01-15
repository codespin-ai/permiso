/**
 * Common types for repository interfaces
 */

import type { Result } from "@codespin/permiso-core";

// Pagination input
export type PaginationInput = {
  first?: number;
  after?: string;
  last?: number;
  before?: string;
  offset?: number;
  sortDirection?: "ASC" | "DESC";
};

// Page info for pagination
export type PageInfo = {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
};

// Generic connection type for paginated results
export type Connection<T> = {
  nodes: T[];
  totalCount: number;
  pageInfo: PageInfo;
};

// Property input for creating/updating properties
export type PropertyInput = {
  name: string;
  value: unknown;
  hidden?: boolean;
};

// Property type (what's stored)
export type Property = {
  name: string;
  value: unknown;
  hidden: boolean;
  createdAt: number;
};

// Transaction context - allows repositories to participate in transactions
export type TransactionContext = {
  // Database-specific transaction handle (pg-promise tx or better-sqlite3 transaction)
  tx: unknown;
};

// Result type re-export for convenience
export type { Result };
