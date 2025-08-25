/* eslint-disable @typescript-eslint/no-explicit-any */
import type pgPromise from "pg-promise";
import type { Database } from "./index.js";
import { createRlsDb, createUnrestrictedDb } from "./index.js";
import { createLogger } from "@codespin/permiso-logger";

const logger = createLogger("permiso-db:lazy");

/**
 * Lazy Database Wrapper
 * 
 * This wrapper delays actual database connection creation until first use.
 * It can create either an RLS-enabled connection (with org context) or
 * an unrestricted connection based on whether an orgId is provided.
 * 
 * Benefits:
 * - No unnecessary connection creation
 * - Proper transaction isolation
 * - Clean context separation for ROOT operations
 */
export class LazyDatabase implements Database {
  private actualDb?: Database;
  private isInitialized = false;

  constructor(
    private orgId?: string,
  ) {}

  private ensureInitialized(): Database {
    if (!this.isInitialized) {
      logger.debug(`Initializing database for org: ${this.orgId || 'ROOT'}`);
      
      if (this.orgId) {
        // Create RLS database for organization-scoped operations
        this.actualDb = createRlsDb(this.orgId);
      } else {
        // Create unrestricted database for ROOT operations
        this.actualDb = createUnrestrictedDb();
      }
      
      this.isInitialized = true;
    }
    
    return this.actualDb!;
  }

  async query<T = any>(query: string, values?: any): Promise<T[]> {
    return this.ensureInitialized().query<T>(query, values);
  }

  async one<T = any>(query: string, values?: any): Promise<T> {
    return this.ensureInitialized().one<T>(query, values);
  }

  async oneOrNone<T = any>(query: string, values?: any): Promise<T | null> {
    return this.ensureInitialized().oneOrNone<T>(query, values);
  }

  async none(query: string, values?: any): Promise<null> {
    return this.ensureInitialized().none(query, values);
  }

  async many<T = any>(query: string, values?: any): Promise<T[]> {
    return this.ensureInitialized().many<T>(query, values);
  }

  async manyOrNone<T = any>(query: string, values?: any): Promise<T[]> {
    return this.ensureInitialized().manyOrNone<T>(query, values);
  }

  async any<T = any>(query: string, values?: any): Promise<T[]> {
    return this.ensureInitialized().any<T>(query, values);
  }

  async result(query: string, values?: any): Promise<pgPromise.IResultExt> {
    return this.ensureInitialized().result(query, values);
  }

  async tx<T>(callback: (t: Database) => Promise<T>): Promise<T> {
    return this.ensureInitialized().tx(callback);
  }

  /**
   * Create a new context with ROOT access.
   * This returns a NEW database instance, preserving the original context.
   * This ensures transaction boundaries are maintained.
   */
  upgradeToRoot?(reason?: string): Database {
    logger.debug(`Creating ROOT context`, {
      fromOrg: this.orgId,
      reason,
      timestamp: new Date().toISOString(),
    });
    
    // If already ROOT (no orgId), return self
    if (!this.orgId) {
      return this;
    }
    
    // Create a new lazy database for ROOT operations
    // This ensures we don't mutate the existing context
    return new LazyDatabase();
  }
}

/**
 * Create a lazy database wrapper
 * @param orgId Optional organization ID for RLS operations
 */
export function createLazyDb(orgId?: string): Database {
  return new LazyDatabase(orgId);
}