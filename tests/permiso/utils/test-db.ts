import knex from 'knex';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { getDb, initDb, type Database } from '@codespin/permiso-db';
import testConfig from '../../../database/permiso-test/knexfile.js';

const exec = promisify(execCallback);

export class TestDatabase {
  private static instance: TestDatabase | null = null;
  private knexInstance: any;
  private dbName: string;

  private constructor() {
    this.dbName = testConfig.connection.database;
  }

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase();
    }
    return TestDatabase.instance;
  }

  async createDatabase(): Promise<void> {
    // Connect to postgres database to create the test database
    const adminConfig = {
      ...testConfig,
      connection: {
        ...testConfig.connection,
        database: 'postgres'
      }
    };

    const adminKnex = knex(adminConfig);
    
    try {
      // Drop database if exists
      await adminKnex.raw(`DROP DATABASE IF EXISTS ${this.dbName}`);
      
      // Create fresh database
      await adminKnex.raw(`CREATE DATABASE ${this.dbName}`);
      
      console.log(`Created test database: ${this.dbName}`);
    } finally {
      await adminKnex.destroy();
    }
  }

  async runMigrations(): Promise<void> {
    // Use knex instance to run migrations directly
    this.knexInstance = knex(testConfig);
    
    try {
      await this.knexInstance.migrate.latest({
        directory: '../permiso/migrations'
      });
      console.log('Migrations completed');
    } finally {
      await this.knexInstance.destroy();
    }
  }

  async setup(): Promise<Database> {
    // Create database
    await this.createDatabase();
    
    // Run migrations
    await this.runMigrations();
    
    // Initialize permiso-db with test config
    const db = initDb({
      host: testConfig.connection.host,
      port: testConfig.connection.port,
      database: testConfig.connection.database,
      user: testConfig.connection.user,
      password: testConfig.connection.password,
      max: 10
    });
    
    return db;
  }

  async teardown(): Promise<void> {
    // Close database connection
    const db = getDb();
    if (db) {
      await db.$pool.end();
    }

    // Drop the test database
    const adminConfig = {
      ...testConfig,
      connection: {
        ...testConfig.connection,
        database: 'postgres'
      }
    };

    const adminKnex = knex(adminConfig);
    
    try {
      await adminKnex.raw(`DROP DATABASE IF EXISTS ${this.dbName}`);
      console.log(`Dropped test database: ${this.dbName}`);
    } finally {
      await adminKnex.destroy();
    }
  }

  async truncateAllTables(): Promise<void> {
    const db = getDb();
    
    // Get all tables except migration tables
    const result = await db.query<{ tablename: string }>(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      AND tablename NOT IN ('knex_migrations', 'knex_migrations_lock')
    `);
    
    // Truncate all tables in reverse order to handle foreign keys
    const tables = result.map(row => row.tablename).reverse();
    
    for (const table of tables) {
      await db.none(`TRUNCATE TABLE "${table}" CASCADE`);
    }
  }
}