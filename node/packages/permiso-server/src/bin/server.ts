#!/usr/bin/env node
import { ApolloServer } from "@apollo/server";
import { expressMiddleware } from "@as-integrations/express5";
import { createLogger } from "@codespin/permiso-logger";
import express, { Request, Response } from "express";
import cors from "cors";
import { GraphQLError } from "graphql";
import { getTypeDefs } from "../index.js";
import { resolvers } from "../resolvers/index.js";
import { getBearerAuthConfig, validateBearerToken } from "../auth/bearer.js";
import {
  initializeDatabaseConfig,
  getDatabaseType,
  getPostgresHealthCheckDb,
  getSqliteHealthCheckDb,
  closeDatabaseConnections,
  createRequestRepositories,
} from "../config/index.js";

const logger = createLogger("GraphQLServer");

async function startServer() {
  // Initialize database configuration (validates env vars)
  const dbConfig = await initializeDatabaseConfig();
  logger.info(`Database type: ${dbConfig.type}`);

  // For SQLite mode, warn that domain layer isn't fully migrated yet
  if (dbConfig.type === "sqlite") {
    logger.warn("SQLite mode: Domain layer uses repository pattern");
    logger.warn("Some features may not be fully supported yet");
  }

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
    const services: Record<string, string> = {
      databaseType: getDatabaseType(),
    };

    // Check database connection based on type
    try {
      if (getDatabaseType() === "postgres") {
        const pgDb = getPostgresHealthCheckDb();
        if (pgDb) {
          await pgDb.one("SELECT 1 as ok");
          services.database = "connected";
        } else {
          services.database = "not-initialized";
        }
      } else {
        const sqliteDb = getSqliteHealthCheckDb();
        if (sqliteDb) {
          sqliteDb.prepare("SELECT 1 as ok").get();
          services.database = "connected";
        } else {
          services.database = "not-initialized";
        }
      }
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

        // Create repositories based on configured database type
        // For PostgreSQL: Uses RLS for tenant isolation
        // For SQLite: Uses app-level filtering in repositories
        const repos = await createRequestRepositories(orgId);

        return {
          repos,
          orgId: orgId ?? "",
        };
      },
    }),
  );

  const port = parseInt(process.env.PERMISO_SERVER_PORT!);
  const host = process.env.PERMISO_SERVER_HOST!;

  await new Promise<void>((resolve) => {
    app.listen(port, () => {
      resolve();
    });
  });

  logger.info(`GraphQL server running at http://${host}:${port}/graphql`);
  logger.info(`Health endpoint available at http://${host}:${port}/health`);

  // Graceful shutdown handling
  const shutdown = () => {
    logger.info("Shutting down server...");
    closeDatabaseConnections();
    process.exit(0);
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

startServer().catch((error) => {
  logger.error("Failed to start server:", {
    message: error.message,
    stack: error.stack,
  });
  process.exit(1);
});
