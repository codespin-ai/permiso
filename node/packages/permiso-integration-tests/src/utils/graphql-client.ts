import {
  ApolloClient,
  InMemoryCache,
  DocumentNode,
  NormalizedCacheObject,
  createHttpLink,
} from "@apollo/client/core/index.js";
import type {
  ApolloQueryResult,
  FetchResult,
} from "@apollo/client/core/index.js";
import { Logger, testLogger } from "@codespin/permiso-test-utils";

export class GraphQLClient {
  private client: ApolloClient<NormalizedCacheObject>;
  private logger: Logger;

  constructor(
    uri: string,
    options?: { headers?: Record<string, string>; logger?: Logger },
  ) {
    const httpLink = createHttpLink({
      uri,
      fetch,
      headers: options?.headers,
    });

    this.client = new ApolloClient({
      link: httpLink,
      cache: new InMemoryCache(),
      defaultOptions: {
        query: {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        },
        mutate: {
          fetchPolicy: "no-cache",
          errorPolicy: "all",
        },
      },
    });
    this.logger = options?.logger || testLogger;
  }

  async query<T = any>(
    queryDoc: DocumentNode,
    variables?: Record<string, any>,
  ): Promise<ApolloQueryResult<T>> {
    try {
      return await this.client.query<T>({
        query: queryDoc,
        variables,
      });
    } catch (error: any) {
      if (error.networkError?.result?.errors) {
        this.logger.error(
          "GraphQL Errors:",
          JSON.stringify(error.networkError.result.errors, null, 2),
        );
      }
      throw error;
    }
  }

  async mutate<T = any>(
    mutationDoc: DocumentNode,
    variables?: Record<string, any>,
  ): Promise<FetchResult<T>> {
    try {
      return await this.client.mutate<T>({
        mutation: mutationDoc,
        variables,
      });
    } catch (error: any) {
      if (error.networkError?.result?.errors) {
        this.logger.error(
          "GraphQL Errors:",
          JSON.stringify(error.networkError.result.errors, null, 2),
        );
      }
      throw error;
    }
  }

  async stop(): Promise<void> {
    // Stop the Apollo Client to clean up any active connections
    await this.client.stop();
    await this.client.clearStore();
  }
}
