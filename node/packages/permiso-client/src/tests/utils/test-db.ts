import knex from 'knex';

// Import the base config helper from root knexfile
const rootPath = new URL('../../../../../../knexfile.js', import.meta.url);
const { createDbConfig } = await import(rootPath.href);

export class TestDatabase {
  private config: any;
  private dbName: string;
  
  constructor() {
    this.dbName = 'permiso_client_test';
    // Use the main PERMISO database config
    this.config = createDbConfig('permiso');
  }

  async setup(): Promise<void> {
    // Setting up test database
    
    // Create database if it doesn't exist
    const adminConfig = {
      ...this.config,
      connection: {
        ...this.config.connection,
        database: 'postgres'
      }
    };
    const adminDb = knex(adminConfig);
    
    try {
      // Check if database exists
      const result = await adminDb.raw(
        `SELECT 1 FROM pg_database WHERE datname = ?`,
        [this.dbName]
      );
      
      if (result.rows.length === 0) {
        // Creating database
        await adminDb.raw(`CREATE DATABASE ${this.dbName}`);
      }
    } finally {
      await adminDb.destroy();
    }
    
    // Run migrations on the test database
    const testDbConfig = {
      ...this.config,
      connection: {
        ...(this.config.connection as any),
        database: this.dbName,
      },
      migrations: {
        directory: new URL('../../../../../../database/permiso/migrations', import.meta.url).pathname,
      },
    };
    
    const testDb = knex(testDbConfig);
    
    try {
      // Running migrations
      await testDb.migrate.latest();
      // Test database setup complete
    } finally {
      await testDb.destroy();
    }
  }

  async cleanup(): Promise<void> {
    // Cleaning up test database
    
    const testDb = knex({
      ...this.config,
      connection: {
        ...this.config.connection,
        database: this.dbName,
      },
    });
    
    try {
      // Truncate all tables
      const tables = [
        'user_permission',
        'role_permission',
        'user_role',
        'user_property',
        'role_property',
        'organization_property',
        'user',
        'role',
        'resource',
        'organization',
      ];
      
      for (const table of tables) {
        await testDb.raw(`TRUNCATE TABLE "${table}" CASCADE`);
      }
      
      // Test database cleaned
    } finally {
      await testDb.destroy();
    }
  }

  async teardown(): Promise<void> {
    // Tearing down test database
    
    const adminConfig = {
      ...this.config,
      connection: {
        ...this.config.connection,
        database: 'postgres'
      }
    };
    const adminDb = knex(adminConfig);
    
    try {
      // Terminate any active connections
      await adminDb.raw(`
        SELECT pg_terminate_backend(pid)
        FROM pg_stat_activity
        WHERE datname = ? AND pid <> pg_backend_pid()
      `, [this.dbName]);
      
      // Drop the database
      await adminDb.raw(`DROP DATABASE IF EXISTS ${this.dbName}`);
      // Test database dropped
    } finally {
      await adminDb.destroy();
    }
  }
}