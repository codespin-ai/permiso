/**
 * Configuration module exports
 */

export {
  initializeDatabaseConfig,
  getDatabaseType,
  createRequestRepositories,
  getPostgresHealthCheckDb,
  getSqliteHealthCheckDb,
  closeDatabaseConnections,
  type DatabaseType,
  type DatabaseConfig,
} from "./database.js";
