import knex, { Knex } from 'knex';

// Import the base config helper from root knexfile
const rootPath = new URL('../../../../../knexfile.js', import.meta.url);
const { createDbConfig } = await import(rootPath.href);

export interface TestDatabaseOptions {
  dbName?: string;
}

export class TestDatabase {
  private static instances = new Map<string, TestDatabase>();
  private knexInstance: Knex | null = null;
  private dbName: string;
  private config: any;

  constructor(options: TestDatabaseOptions = {}) {
    // Use the main PERMISO database config but with a test database name
    this.dbName = options.dbName || 'permiso_test';
    this.config = {
      ...createDbConfig('permiso'),
      connection: {
        ...createDbConfig('permiso').connection,
        database: this.dbName
      }
    };
  }

  static getInstance(dbName: string = 'permiso_test'): TestDatabase {
    if (!TestDatabase.instances.has(dbName)) {
      TestDatabase.instances.set(dbName, new TestDatabase({ dbName }));
    }
    return TestDatabase.instances.get(dbName)!;
  }

  async createDatabase(): Promise<void> {
    // Connect to postgres database to create the test database
    const adminConfig = {
      ...this.config,
      connection: {
        host: this.config.connection.host,
        port: this.config.connection.port,
        user: this.config.connection.user,
        password: this.config.connection.password,
        database: 'postgres'
      }
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
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Drop database if exists
      await adminKnex.raw(`DROP DATABASE IF EXISTS "${this.dbName}"`);
      
      // Create fresh database
      await adminKnex.raw(`CREATE DATABASE "${this.dbName}"`);
      
      // Created test database
    } finally {
      await adminKnex.destroy();
    }
  }

  async runMigrations(): Promise<void> {
    // Use knex instance to run migrations
    this.knexInstance = knex(this.config);
    
    try {
      // Run migrations from the permiso database directory
      const migrationsPath = new URL('../../../../../database/permiso/migrations', import.meta.url);
      await this.knexInstance.migrate.latest({
        directory: migrationsPath.pathname
      });
      // Migrations completed
    } finally {
      await this.knexInstance.destroy();
      this.knexInstance = null;
    }
  }

  async setup(): Promise<void> {
    // Create database
    await this.createDatabase();
    
    // Run migrations
    await this.runMigrations();
  }

  async teardown(): Promise<void> {
    // Drop the test database
    const adminConfig = {
      ...this.config,
      connection: {
        host: this.config.connection.host,
        port: this.config.connection.port,
        user: this.config.connection.user,
        password: this.config.connection.password,
        database: 'postgres'
      }
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
      await new Promise(resolve => setTimeout(resolve, 100));
      
      await adminKnex.raw(`DROP DATABASE IF EXISTS "${this.dbName}"`);
      // Dropped test database
    } catch (error) {
      console.error('Error dropping test database:', error);
    } finally {
      await adminKnex.destroy();
    }
  }

  async truncateAllTables(): Promise<void> {
    this.knexInstance = knex(this.config);
    
    try {
      // Get all tables except migration tables
      const result = await this.knexInstance.raw<{rows: Array<{tablename: string}>}>(`
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock')
      `);
      
      // Truncate all tables in reverse order to handle foreign keys
      const tables = result.rows.map(row => row.tablename).reverse();
      
      for (const table of tables) {
        await this.knexInstance.raw(`TRUNCATE TABLE "${table}" CASCADE`);
      }
    } finally {
      await this.knexInstance.destroy();
      this.knexInstance = null;
    }
  }
}