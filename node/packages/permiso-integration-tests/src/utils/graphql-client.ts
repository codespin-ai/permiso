import { ApolloClient, InMemoryCache, DocumentNode, NormalizedCacheObject } from '@apollo/client/core/index.js';
import type { ApolloQueryResult, FetchResult } from '@apollo/client/core/index.js';

export class GraphQLClient {
  private client: ApolloClient<NormalizedCacheObject>;

  constructor(uri: string) {
    this.client = new ApolloClient({
      uri,
      cache: new InMemoryCache(),
      defaultOptions: {
        query: {
          fetchPolicy: 'no-cache',
        },
        mutate: {
          fetchPolicy: 'no-cache',
        },
      },
    });
  }

  async query<T = any>(queryDoc: DocumentNode, variables?: Record<string, any>): Promise<ApolloQueryResult<T>> {
    return this.client.query<T>({
      query: queryDoc,
      variables,
    });
  }

  async mutate<T = any>(mutationDoc: DocumentNode, variables?: Record<string, any>): Promise<FetchResult<T>> {
    return this.client.mutate<T>({
      mutation: mutationDoc,
      variables,
    });
  }
}