/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */
import type pgPromise from "pg-promise";
import type { Database } from "./index.js";
import { createUnrestrictedDb } from "./index.js";

/**
 * RLS Database Wrapper
 *
 * This wrapper automatically injects the organization context (app.current_org_id)
 * before every query to ensure Row Level Security policies are applied.
 *
 * It uses transactions with SET LOCAL to ensure the context is properly scoped.
 */
export class RlsDatabaseWrapper implements Database {
  private upgradedConnection?: Database; // Cache the upgraded connection

  constructor(
    private db: pgPromise.IDatabase<any>,
    private orgId: string,
  ) {
    if (!orgId) {
      throw new Error("Organization ID is required for RLS database");
    }
    console.log(`[RLS WRAPPER] Created new RLS wrapper for org: ${orgId}`);
  }

  /**
   * Upgrade to unrestricted ROOT access for cross-organization operations.
   * This should only be used by organization management APIs.
   * 
   * @param reason Optional reason for audit logging
   * @returns Unrestricted database connection
   */
  upgradeToRoot(reason?: string): Database {
    // Return cached connection if already upgraded
    if (this.upgradedConnection) {
      return this.upgradedConnection;
    }

    // Log the escalation for audit (only on first upgrade)
    console.log("[AUDIT] Database access upgraded to ROOT", {
      orgId: this.orgId,
      reason,
      timestamp: new Date().toISOString(),
    });

    // Create and cache the unrestricted database connection
    this.upgradedConnection = createUnrestrictedDb();
    return this.upgradedConnection;
  }


  /**
   * Wraps a database operation with organization context
   * Uses SET LOCAL within a transaction to ensure proper scoping
   */
  private async withOrgContext<T>(
    operation: (db: pgPromise.IDatabase<any>) => Promise<T>,
  ): Promise<T> {
    // For single queries, use a savepoint to minimize overhead
    return this.db.tx("rls-context", async (t) => {
      await t.none("SET LOCAL app.current_org_id = $1", [this.orgId]);
      return operation(t);
    });
  }

  async query<T = any>(query: string, values?: any): Promise<T[]> {
    return this.withOrgContext((db) => db.query<T>(query, values)) as Promise<
      T[]
    >;
  }

  async one<T = any>(query: string, values?: any): Promise<T> {
    return this.withOrgContext((db) => db.one<T>(query, values));
  }

  async oneOrNone<T = any>(query: string, values?: any): Promise<T | null> {
    return this.withOrgContext((db) => db.oneOrNone<T>(query, values));
  }

  async none(query: string, values?: any): Promise<null> {
    return this.withOrgContext((db) => db.none(query, values));
  }

  async many<T = any>(query: string, values?: any): Promise<T[]> {
    return this.withOrgContext((db) => db.many<T>(query, values));
  }

  async manyOrNone<T = any>(query: string, values?: any): Promise<T[]> {
    return this.withOrgContext((db) => db.manyOrNone<T>(query, values));
  }

  async any<T = any>(query: string, values?: any): Promise<T[]> {
    return this.withOrgContext((db) => db.any<T>(query, values));
  }

  async result(query: string, values?: any): Promise<pgPromise.IResultExt> {
    return this.withOrgContext((db) => db.result(query, values));
  }

  /**
   * Handle nested transactions
   * The organization context is set at the beginning of the transaction
   */
  async tx<T>(callback: (t: Database) => Promise<T>): Promise<T> {
    return this.db.tx("rls-tx", async (t) => {
      // Set context for this transaction
      await t.none("SET LOCAL app.current_org_id = $1", [this.orgId]);

      // Create a transaction wrapper that doesn't re-set context
      const txWrapper = new TransactionWrapper(t, this.orgId);
      return callback(txWrapper);
    });
  }
}

/**
 * Transaction Wrapper
 *
 * Used within transactions to avoid re-setting the organization context
 * since SET LOCAL is already applied at the transaction level.
 */
class TransactionWrapper implements Database {
  constructor(
    private t: pgPromise.ITask<any>,
    private orgId: string,
  ) {}

  async query<T = any>(query: string, values?: any): Promise<T[]> {
    return this.t.query<T>(query, values) as Promise<T[]>;
  }

  async one<T = any>(query: string, values?: any): Promise<T> {
    return this.t.one<T>(query, values);
  }

  async oneOrNone<T = any>(query: string, values?: any): Promise<T | null> {
    return this.t.oneOrNone<T>(query, values);
  }

  async none(query: string, values?: any): Promise<null> {
    return this.t.none(query, values);
  }

  async many<T = any>(query: string, values?: any): Promise<T[]> {
    return this.t.many<T>(query, values);
  }

  async manyOrNone<T = any>(query: string, values?: any): Promise<T[]> {
    return this.t.manyOrNone<T>(query, values);
  }

  async any<T = any>(query: string, values?: any): Promise<T[]> {
    return this.t.any<T>(query, values);
  }

  async result(query: string, values?: any): Promise<pgPromise.IResultExt> {
    return this.t.result(query, values);
  }

  /**
   * Nested transaction within an already contextualized transaction
   */
  async tx<T>(callback: (t: Database) => Promise<T>): Promise<T> {
    return this.t.tx("nested-tx", async (nestedT) => {
      // Context is already set by parent transaction
      const nestedWrapper = new TransactionWrapper(nestedT, this.orgId);
      return callback(nestedWrapper);
    });
  }
}
