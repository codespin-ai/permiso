import { Result, success, failure, GraphQLResponse, GraphQLError } from './types.js';

export type GraphQLRequestOptions = {
  endpoint: string;
  query: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
};

/**
 * Make a GraphQL request
 */
export async function graphqlRequest<T>(
  options: GraphQLRequestOptions
): Promise<Result<T, Error>> {
  try {
    const controller = new AbortController();
    const timeoutId = options.timeout 
      ? setTimeout(() => controller.abort(), options.timeout)
      : null;

    const response = await fetch(options.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      body: JSON.stringify({
        query: options.query,
        variables: options.variables
      }),
      signal: controller.signal
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const result = await response.json() as GraphQLResponse<T>;

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      const error = result.errors[0];
      if (error) {
        const errorMessage = formatGraphQLError(error);
        return failure(new Error(errorMessage));
      }
      return failure(new Error('Unknown GraphQL error'));
    }

    // Check for data
    if (!result.data) {
      return failure(new Error('No data returned from GraphQL query'));
    }

    return success(result.data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        return failure(new Error('Request timeout'));
      }
      return failure(error);
    }
    return failure(new Error('Unknown error'));
  }
}

/**
 * Format GraphQL error for display
 */
function formatGraphQLError(error: GraphQLError): string {
  let message = error.message;
  
  if (error.extensions?.code) {
    message = `[${error.extensions.code}] ${message}`;
  }
  
  return message;
}