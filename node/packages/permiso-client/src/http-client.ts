import {
  Result,
  success,
  failure,
  GraphQLResponse,
  GraphQLError,
  Logger,
} from "./types.js";

export type GraphQLRequestOptions = {
  endpoint: string;
  query: string;
  variables?: Record<string, unknown>;
  headers?: Record<string, string>;
  timeout?: number;
  logger?: Logger;
};

/**
 * Make a GraphQL request
 */
export async function graphqlRequest<T>(
  options: GraphQLRequestOptions,
): Promise<Result<T, Error>> {
  try {
    options.logger?.debug("GraphQL request:", {
      endpoint: options.endpoint,
      query: options.query.trim().split("\n")[0] + "...",
      variables: options.variables,
    });
    const controller = new AbortController();
    const timeoutId = options.timeout
      ? setTimeout(() => controller.abort(), options.timeout)
      : null;

    const response = await fetch(options.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
      body: JSON.stringify({
        query: options.query,
        variables: options.variables,
      }),
      signal: controller.signal,
    });

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    const result = (await response.json()) as GraphQLResponse<T>;

    options.logger?.debug("GraphQL response:", {
      status: response.status,
      hasData: !!result.data,
      hasErrors: !!(result.errors && result.errors.length > 0),
    });

    // Check for GraphQL errors
    if (result.errors && result.errors.length > 0) {
      const error = result.errors[0];
      if (error) {
        const errorMessage = formatGraphQLError(error);
        options.logger?.error("GraphQL error:", errorMessage, error);
        return failure(new Error(errorMessage));
      }
      return failure(new Error("Unknown GraphQL error"));
    }

    // Check for data
    if (!result.data) {
      return failure(new Error("No data returned from GraphQL query"));
    }

    return success(result.data);
  } catch (error) {
    if (error instanceof Error) {
      if (error.name === "AbortError") {
        options.logger?.error("Request timeout");
        return failure(new Error("Request timeout"));
      }
      options.logger?.error("Request error:", error.message);
      return failure(error);
    }
    options.logger?.error("Unknown error:", error);
    return failure(new Error("Unknown error"));
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
