#!/usr/bin/env node
import { ApolloServer } from '@apollo/server';
import { startStandaloneServer } from '@apollo/server/standalone';
import { createDatabaseConnection } from '@codespin/permiso-db';
import { createLogger } from '@codespin/permiso-logger';
import { GraphQLError } from 'graphql';
import { getTypeDefs } from '../index.js';
import { resolvers } from '../resolvers/index.js';
import { getApiKeyConfig, validateApiKey } from '../auth/api-key.js';

const logger = createLogger('GraphQLServer');

async function startServer() {
  // Initialize database
  const dbConfig = {
    host: process.env.PERMISO_DB_HOST || 'localhost',
    port: parseInt(process.env.PERMISO_DB_PORT || '5432'),
    database: process.env.PERMISO_DB_NAME || 'permiso',
    user: process.env.PERMISO_DB_USER || 'postgres',
    password: process.env.PERMISO_DB_PASSWORD || 'postgres',
  };
  
  const db = createDatabaseConnection(dbConfig);
  
  // Get API key configuration
  const apiKeyConfig = getApiKeyConfig();
  if (apiKeyConfig.enabled) {
    logger.info('API key authentication is enabled');
  }
  
  // Create GraphQL server
  const server = new ApolloServer({
    typeDefs: getTypeDefs(),
    resolvers,
  });
  
  const port = parseInt(process.env.PERMISO_SERVER_PORT || '5001');
  
  const { url } = await startStandaloneServer(server, {
    context: async ({ req }) => {
      // Validate API key if enabled
      const apiKey = req.headers[apiKeyConfig.headerName] as string | undefined;
      const validationResult = validateApiKey(apiKey, apiKeyConfig);
      
      if (!validationResult.success) {
        throw new GraphQLError(validationResult.error.message, {
          extensions: {
            code: 'UNAUTHENTICATED',
            http: { status: 401 }
          }
        });
      }
      
      return { db };
    },
    listen: { port },
  });
  
  logger.info(`🚀 GraphQL server running at ${url}`);
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});