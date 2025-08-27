#!/usr/bin/env node
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { createLazyDb } from "@codespin/permiso-db";
import { createLogger } from "@codespin/permiso-logger";
import express, { Request, Response } from "express";
import cors from "cors";
import { GraphQLError } from "graphql";
import { getTypeDefs } from "../index.js";
import { resolvers } from "../resolvers/index.js";
import { getBearerAuthConfig, validateBearerToken } from "../auth/bearer.js";

const logger = createLogger("GraphQLServer");

async function startServer() {
  // Initialize health check database
  const healthCheckDb = createLazyDb();

  // Get Bearer authentication configuration
  const bearerConfig = getBearerAuthConfig();
  if (bearerConfig.enabled) {
    logger.info("Bearer authentication is enabled");
  }

  // Create Express app
  const app = express();

  // Create GraphQL server
  const server = new ApolloServer({
    typeDefs: getTypeDefs(),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolvers: resolvers as any,
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
        // Validate Bearer token if enabled
        const authHeader = req.headers.authorization as string | undefined;
        const validationResult = validateBearerToken(authHeader, bearerConfig);

        if (!validationResult.success) {
          throw new GraphQLError(validationResult.error.message, {
            extensions: {
              code: "UNAUTHENTICATED",
              http: { status: 401 },
            },
          });
        }

        // Extract organization ID from header (optional)
        const orgId = req.headers["x-org-id"] as string | undefined;

        // Create lazy database connection
        // It will only connect when actually used
        const db = createLazyDb(orgId);

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
