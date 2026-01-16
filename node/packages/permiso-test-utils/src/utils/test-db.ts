import knex, { Knex } from "knex";
import { existsSync, unlinkSync, mkdirSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";
import { Logger, testLogger } from "./test-logger.js";

// Database type from environment
const dbType = process.env.PERMISO_DB_TYPE || "sqlite";

// Get the project root directory (5 levels up from this file)
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../../../../..");

export interface TestDatabaseOptions {
  dbName?: string;
  sqlitePath?: string;
  logger?: Logger;
}

export class TestDatabase {
  private static instances = new Map<string, TestDatabase>();
  private knexInstance: Knex | null = null;
  private dbName: string;
  private sqlitePath: string;
  private dbType: "sqlite" | "postgres";
  private config: Knex.Config | null = null;
  private logger: Logger;

  constructor(options: TestDatabaseOptions = {}) {
    this.dbType = dbType as "sqlite" | "postgres";
    this.dbName = options.dbName || "permiso_test";
    // Use absolute path for SQLite to avoid cwd issues
    const defaultSqlitePath = resolve(projectRoot, "data/test-permiso.db");
    this.sqlitePath =
      options.sqlitePath ||
      process.env.PERMISO_SQLITE_PATH ||
      defaultSqlitePath;
    this.logger = options.logger || testLogger;
  }

  static getInstance(
    dbName: string = "permiso_test",
    logger?: Logger,
  ): TestDatabase {
    if (!TestDatabase.instances.has(dbName)) {
      TestDatabase.instances.set(dbName, new TestDatabase({ dbName, logger }));
    }
    return TestDatabase.instances.get(dbName)!;
  }

  private async getConfig(): Promise<Knex.Config> {
    if (this.config) return this.config;

    if (this.dbType === "sqlite") {
      this.config = {
        client: "better-sqlite3",
        useNullAsDefault: true,
        connection: {
          filename: this.sqlitePath,
        },
      };
    } else {
      // PostgreSQL - import base config from root knexfile
      const rootPath = new URL("../../../../../knexfile.js", import.meta.url);
      const { createDbConfig } = await import(rootPath.href);
      this.config = {
        ...createDbConfig("permiso"),
        connection: {
          ...createDbConfig("permiso").connection,
          database: this.dbName,
        },
      };
    }

    return this.config!;
  }

  async createDatabase(): Promise<void> {
    if (this.dbType === "sqlite") {
      // For SQLite, just ensure the directory exists and remove any existing file
      const dir = dirname(this.sqlitePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      if (existsSync(this.sqlitePath)) {
        unlinkSync(this.sqlitePath);
      }
      this.logger.info(`Prepared SQLite database at ${this.sqlitePath}`);
    } else {
      // PostgreSQL - create database
      const config = await this.getConfig();
      const adminConfig = {
        ...config,
        connection: {
          host: (config.connection as any).host,
          port: (config.connection as any).port,
          user: (config.connection as any).user,
          password: (config.connection as any).password,
          database: "postgres",
        },
      };

      const adminKnex = knex(adminConfig);

      try {
        // First, force disconnect all connections to the test database
        await adminKnex.raw(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = '${this.dbName}'
          AND pid <> pg_backend_pid()
        `);

        // Wait a moment for connections to terminate
        await new Promise((resolve) => setTimeout(resolve, 100));

        // Drop database if exists
        await adminKnex.raw(`DROP DATABASE IF EXISTS "${this.dbName}"`);

        // Create fresh database
        await adminKnex.raw(`CREATE DATABASE "${this.dbName}"`);

        this.logger.info(`Created test database ${this.dbName}`);
      } finally {
        await adminKnex.destroy();
      }
    }
  }

  async runMigrations(): Promise<void> {
    const config = await this.getConfig();
    this.knexInstance = knex(config);

    try {
      // Run migrations from the appropriate database directory
      const migrationsDir =
        this.dbType === "sqlite"
          ? "../../../../../database/permiso/sqlite/migrations"
          : "../../../../../database/permiso/migrations";

      const migrationsPath = new URL(migrationsDir, import.meta.url);
      await this.knexInstance.migrate.latest({
        directory: fileURLToPath(migrationsPath),
      });
      this.logger.info(`Migrations completed (${this.dbType})`);
    } finally {
      await this.knexInstance.destroy();
      this.knexInstance = null;
    }
  }

  async setup(): Promise<void> {
    this.logger.info(`Setting up ${this.dbType} test database...`);

    // Create database
    await this.createDatabase();

    // Run migrations
    await this.runMigrations();
  }

  async teardown(): Promise<void> {
    if (this.dbType === "sqlite") {
      // For SQLite, just remove the file
      if (existsSync(this.sqlitePath)) {
        unlinkSync(this.sqlitePath);
        this.logger.info(`Removed SQLite database at ${this.sqlitePath}`);
      }
    } else {
      // PostgreSQL - drop the test database
      const config = await this.getConfig();
      const adminConfig = {
        ...config,
        connection: {
          host: (config.connection as any).host,
          port: (config.connection as any).port,
          user: (config.connection as any).user,
          password: (config.connection as any).password,
          database: "postgres",
        },
      };

      const adminKnex = knex(adminConfig);

      try {
        // First, force disconnect all connections to the test database
        await adminKnex.raw(`
          SELECT pg_terminate_backend(pg_stat_activity.pid)
          FROM pg_stat_activity
          WHERE pg_stat_activity.datname = '${this.dbName}'
          AND pid <> pg_backend_pid()
        `);

        // Wait a moment for connections to terminate
        await new Promise((resolve) => setTimeout(resolve, 100));

        await adminKnex.raw(`DROP DATABASE IF EXISTS "${this.dbName}"`);
        this.logger.info(`Dropped test database ${this.dbName}`);
      } catch (error) {
        this.logger.error("Error dropping test database:", error);
      } finally {
        await adminKnex.destroy();
      }
    }
  }

  async truncateAllTables(): Promise<void> {
    const config = await this.getConfig();
    this.knexInstance = knex(config);

    try {
      if (this.dbType === "sqlite") {
        // Get all tables for SQLite
        const tables = await this.knexInstance.raw<
          Array<{ name: string }>
        >(`SELECT name FROM sqlite_master WHERE type='table'
           AND name NOT IN ('knex_migrations', 'knex_migrations_lock', 'sqlite_sequence')`);

        // Disable foreign keys temporarily
        await this.knexInstance.raw("PRAGMA foreign_keys = OFF");

        for (const table of tables) {
          await this.knexInstance.raw(`DELETE FROM "${table.name}"`);
        }

        // Re-enable foreign keys
        await this.knexInstance.raw("PRAGMA foreign_keys = ON");
      } else {
        // PostgreSQL - Get all tables except migration tables
        const result = await this.knexInstance.raw<{
          rows: Array<{ tablename: string }>;
        }>(`
          SELECT tablename
          FROM pg_tables
          WHERE schemaname = 'public'
          AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock')
        `);

        // Truncate all tables in reverse order to handle foreign keys
        const tables = result.rows.map((row) => row.tablename).reverse();

        for (const table of tables) {
          await this.knexInstance.raw(`TRUNCATE TABLE "${table}" CASCADE`);
        }
      }
    } finally {
      await this.knexInstance.destroy();
      this.knexInstance = null;
    }
  }
}
