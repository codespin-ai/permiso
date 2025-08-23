#!/usr/bin/env node
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import {
  createRlsDb,
  createUnrestrictedDb,
  createDatabaseConnection,
} from "@codespin/permiso-db";
import { createLogger } from "@codespin/permiso-logger";
import express, { Request, Response } from "express";
import cors from "cors";
import { GraphQLError } from "graphql";
import { getTypeDefs } from "../index.js";
import { resolvers } from "../resolvers/index.js";
import { getApiKeyConfig, validateApiKey } from "../auth/api-key.js";

const logger = createLogger("GraphQLServer");

async function startServer() {
  // Initialize health check database (uses legacy connection for system operations)
  const dbConfig = {
    host: process.env.PERMISO_DB_HOST || "localhost",
    port: parseInt(process.env.PERMISO_DB_PORT || "5432"),
    database: process.env.PERMISO_DB_NAME || "permiso",
    user: process.env.PERMISO_DB_USER || "postgres",
    password: process.env.PERMISO_DB_PASSWORD || "postgres",
  };

  const healthCheckDb = createDatabaseConnection(dbConfig);

  // Get API key configuration
  const apiKeyConfig = getApiKeyConfig();
  if (apiKeyConfig.enabled) {
    logger.info("API key authentication is enabled");
  }

  // Create Express app
  const app = express();

  // Create GraphQL server
  const server = new ApolloServer({
    typeDefs: getTypeDefs(),
    resolvers,
  });

  // Health check endpoint (no auth required) - before GraphQL setup
  app.get("/health", async (_req: Request, res: Response) => {
    const services: Record<string, string> = {};

    // Check database connection
    try {
      await healthCheckDb.one("SELECT 1 as ok");
      services.database = "connected";
    } catch (error) {
      services.database = "disconnected";
      logger.error("Database health check failed:", error);
    }

    const isHealthy = services.database === "connected";

    res.status(isHealthy ? 200 : 503).json({
      status: isHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
      services,
    });
  });

  // Start Apollo Server
  await server.start();

  // Apply GraphQL middleware
  app.use(
    "/graphql",
    cors<cors.CorsRequest>(),
    express.json(),
    expressMiddleware(server, {
      context: async ({ req }: { req: Request }) => {
        // Validate API key if enabled
        const apiKey = req.headers[apiKeyConfig.headerName] as
          | string
          | undefined;
        const validationResult = validateApiKey(apiKey, apiKeyConfig);

        if (!validationResult.success) {
          throw new GraphQLError(validationResult.error.message, {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 401 },
            },
          });
        }

        // Extract organization ID from header
        const orgId = req.headers["x-org-id"] as string | undefined;
        if (!orgId) {
          throw new GraphQLError("Missing x-org-id header", {
            extensions: {
              code: "BAD_USER_INPUT",
              http: { status: 400 },
            },
          });
        }

        // Create RLS-aware database connection
        // Special case: "ROOT" organization gets unrestricted access
        let db;
        try {
          if (orgId === "ROOT") {
            // For ROOT requests, try unrestricted first, fall back to legacy for dev/test
            try {
              db = createUnrestrictedDb();
            } catch (rlsError: any) {
              // If RLS is not configured, fall back to legacy for ROOT requests only
              if (rlsError.message?.includes("UNRESTRICTED_DB_USER_PASSWORD")) {
                logger.warn(
                  "RLS not configured, using legacy database connection for ROOT",
                );
                db = createDatabaseConnection({
                  host: process.env.PERMISO_DB_HOST || "localhost",
                  port: parseInt(process.env.PERMISO_DB_PORT || "5432"),
                  database: process.env.PERMISO_DB_NAME || "permiso",
                  user: process.env.PERMISO_DB_USER || "postgres",
                  password: process.env.PERMISO_DB_PASSWORD || "postgres",
                });
              } else {
                throw rlsError;
              }
            }
          } else {
            // Non-ROOT requests always use RLS (no fallback for security)
            db = createRlsDb(orgId);
          }
        } catch (error) {
          logger.error("Failed to create database connection:", error);
          throw new GraphQLError("Database connection failed", {
            extensions: {
              code: "INTERNAL_SERVER_ERROR",
              http: { status: 500 },
            },
          });
        }

        return {
          db,
          orgId,
        };
      },
    }),
  );

  const port = parseInt(process.env.PERMISO_SERVER_PORT || "5001");

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      resolve();
    });
  });

  logger.info(`🚀 GraphQL server running at http://localhost:${port}/graphql`);
  logger.info(
    `💚 Health endpoint available at http://localhost:${port}/health`,
  );
}

startServer().catch((error) => {
  logger.error("Failed to start server:", error);
  process.exit(1);
});
