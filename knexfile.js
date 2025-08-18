// Base knex configuration that can be extended by database-specific configs
export const baseConfig = {
  client: "postgresql",
  pool: {
    min: 2,
    max: 10,
  },
  migrations: {
    tableName: "knex_migrations",
  },
};

// Helper function to create a database-specific config
export function createDbConfig(dbName, overrides = {}) {
  const dbNameUpper = dbName.toUpperCase();

  return {
    ...baseConfig,
    connection: {
      host: process.env[`${dbNameUpper}_DB_HOST`] || "localhost",
      port: parseInt(process.env[`${dbNameUpper}_DB_PORT`] || "5432"),
      database: process.env[`${dbNameUpper}_DB_NAME`] || dbName.toLowerCase(),
      user: process.env[`${dbNameUpper}_DB_USER`] || "postgres",
      password: process.env[`${dbNameUpper}_DB_PASSWORD`] || "postgres",
    },
    migrations: {
      ...baseConfig.migrations,
      directory: "./migrations",
    },
    seeds: {
      directory: "./seeds",
    },
    ...overrides,
  };
}

// No default export - this file only provides base configuration for database-specific configs
// Each database must have its own knexfile.js that imports and uses createDbConfig
