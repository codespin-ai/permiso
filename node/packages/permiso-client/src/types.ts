/**
 * Permiso client configuration
 */
export type PermisoConfig = {
  /** The GraphQL endpoint URL */
  endpoint: string;
  /** Optional API key for authentication */
  apiKey?: string;
  /** Request timeout in milliseconds */
  timeout?: number;
};

/**
 * Result type for error handling
 */
export type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E };

/**
 * Success result helper
 */
export function success<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Failure result helper
 */
export function failure<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * GraphQL error response
 */
export type GraphQLError = {
  message: string;
  extensions?: {
    code?: string;
    [key: string]: unknown;
  };
  locations?: Array<{
    line: number;
    column: number;
  }>;
  path?: Array<string | number>;
};

/**
 * GraphQL response
 */
export type GraphQLResponse<T> = {
  data?: T;
  errors?: GraphQLError[];
};