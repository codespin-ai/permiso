/**
 * PostgreSQL Organization Repository
 *
 * Uses Tinqer for type-safe queries. Organizations are not RLS-protected.
 */

import { createLogger } from "@codespin/permiso-logger";
import {
  executeSelect,
  executeInsert,
  executeUpdate,
  executeDelete,
} from "@tinqerjs/pg-promise-adapter";
import type { Database } from "@codespin/permiso-db";
import { schema, type OrganizationRow } from "./tinqer-schema.js";
import type {
  IOrganizationRepository,
  Organization,
  OrganizationFilter,
  CreateOrganizationInput,
  UpdateOrganizationInput,
  Property,
  PropertyInput,
  PaginationInput,
  Connection,
  Result,
} from "../interfaces/index.js";

const logger = createLogger("permiso-server:repos:postgres:organization");

function mapOrganizationFromDb(row: {
  id: string;
  name: string;
  description: string | null;
  created_at: number;
  updated_at: number;
}): Organization {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPropertyFromDb(row: {
  name: string;
  value: string;
  hidden: boolean;
  created_at: number;
}): Property {
  return {
    name: row.name,
    value: typeof row.value === "string" ? JSON.parse(row.value) : row.value,
    hidden: Boolean(row.hidden),
    createdAt: row.created_at,
  };
}

export function createOrganizationRepository(
  db: Database,
): IOrganizationRepository {
  return {
    async create(
      input: CreateOrganizationInput,
    ): Promise<Result<Organization>> {
      try {
        const now = Date.now();

        const orgRows = await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              id: string;
              name: string;
              description: string | null;
              created_at: number;
              updated_at: number;
            },
          ) =>
            q
              .insertInto("organization")
              .values({
                id: p.id,
                name: p.name,
                description: p.description,
                created_at: p.created_at,
                updated_at: p.updated_at,
              })
              .returning((o) => o),
          {
            id: input.id,
            name: input.name,
            description: input.description ?? null,
            created_at: now,
            updated_at: now,
          },
        );

        if (input.properties && input.properties.length > 0) {
          for (const prop of input.properties) {
            await executeInsert(
              db,
              schema,
              (
                q,
                p: {
                  parent_id: string;
                  name: string;
                  value: string;
                  hidden: boolean;
                  created_at: number;
                },
              ) =>
                q.insertInto("organization_property").values({
                  parent_id: p.parent_id,
                  name: p.name,
                  value: p.value,
                  hidden: p.hidden,
                  created_at: p.created_at,
                }),
              {
                parent_id: input.id,
                name: prop.name,
                value:
                  prop.value === undefined
                    ? "null"
                    : JSON.stringify(prop.value),
                hidden: prop.hidden ?? false,
                created_at: now,
              },
            );
          }
        }

        if (!orgRows[0]) {
          return {
            success: false,
            error: new Error("Organization not found after creation"),
          };
        }

        return { success: true, data: mapOrganizationFromDb(orgRows[0]) };
      } catch (error) {
        logger.error("Failed to create organization", { error, input });
        return { success: false, error: error as Error };
      }
    },

    async getById(orgId: string): Promise<Result<Organization | null>> {
      try {
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.from("organization").where((o) => o.id === p.orgId),
          { orgId },
        );
        return {
          success: true,
          data: rows[0] ? mapOrganizationFromDb(rows[0]) : null,
        };
      } catch (error) {
        logger.error("Failed to get organization", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async list(
      filter?: OrganizationFilter,
      pagination?: PaginationInput,
    ): Promise<Result<Connection<Organization>>> {
      try {
        let totalCount: number;
        let rows: OrganizationRow[];

        if (filter?.name) {
          // Filtered queries
          totalCount = (await executeSelect(
            db,
            schema,
            (q, p: { namePattern: string }) =>
              q
                .from("organization")
                .where((o) => o.name.includes(p.namePattern))
                .count(),
            { namePattern: filter.name },
          )) as unknown as number;

          rows = await executeSelect(
            db,
            schema,
            (q, p: { namePattern: string; first: number; offset: number }) =>
              q
                .from("organization")
                .where((o) => o.name.includes(p.namePattern))
                .orderBy((o) => o.id)
                .skip(p.offset)
                .take(p.first),
            {
              namePattern: filter.name,
              first: pagination?.first ?? 100,
              offset: pagination?.offset ?? 0,
            },
          );
        } else {
          // Non-filtered queries
          totalCount = (await executeSelect(
            db,
            schema,
            (q) => q.from("organization").count(),
            {},
          )) as unknown as number;

          rows = await executeSelect(
            db,
            schema,
            (q, p: { first: number; offset: number }) =>
              q
                .from("organization")
                .orderBy((o) => o.id)
                .skip(p.offset)
                .take(p.first),
            {
              first: pagination?.first ?? 100,
              offset: pagination?.offset ?? 0,
            },
          );
        }

        return {
          success: true,
          data: {
            nodes: rows.map(mapOrganizationFromDb),
            totalCount,
            pageInfo: {
              hasNextPage: pagination?.first
                ? rows.length === pagination.first
                : false,
              hasPreviousPage: false,
              startCursor: rows[0]?.id ?? null,
              endCursor: rows[rows.length - 1]?.id ?? null,
            },
          },
        };
      } catch (error) {
        logger.error("Failed to list organizations", { error });
        return { success: false, error: error as Error };
      }
    },

    async update(
      orgId: string,
      input: UpdateOrganizationInput,
    ): Promise<Result<Organization>> {
      try {
        const now = Date.now();

        // Build update with all fields - undefined values are skipped by Tinqer
        const rows = await executeUpdate(
          db,
          schema,
          (
            q,
            p: {
              orgId: string;
              updated_at: number;
              name: string | undefined;
              description: string | null | undefined;
            },
          ) =>
            q
              .update("organization")
              .set({
                updated_at: p.updated_at,
                name: p.name,
                description: p.description,
              })
              .where((o) => o.id === p.orgId)
              .returning((o) => o),
          {
            orgId,
            updated_at: now,
            name: input.name,
            description: input.description,
          },
        );

        if (!rows[0]) {
          return { success: false, error: new Error("Organization not found") };
        }

        return { success: true, data: mapOrganizationFromDb(rows[0]) };
      } catch (error) {
        logger.error("Failed to update organization", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async delete(orgId: string): Promise<Result<boolean>> {
      try {
        // Delete all related data in order
        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q
              .deleteFrom("organization_property")
              .where((op) => op.parent_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q
              .deleteFrom("user_permission")
              .where((up) => up.org_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q
              .deleteFrom("role_permission")
              .where((rp) => rp.org_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.deleteFrom("user_property").where((up) => up.org_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.deleteFrom("role_property").where((rp) => rp.org_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.deleteFrom("user_role").where((ur) => ur.org_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.deleteFrom("user").where((u) => u.org_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.deleteFrom("role").where((r) => r.org_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.deleteFrom("resource").where((r) => r.org_id === p.orgId),
          { orgId },
        );

        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q.deleteFrom("organization").where((o) => o.id === p.orgId),
          { orgId },
        );

        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to delete organization", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async getProperties(orgId: string): Promise<Result<Property[]>> {
      try {
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { orgId: string }) =>
            q
              .from("organization_property")
              .where((op) => op.parent_id === p.orgId),
          { orgId },
        );
        return { success: true, data: rows.map(mapPropertyFromDb) };
      } catch (error) {
        logger.error("Failed to get organization properties", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async getProperty(
      orgId: string,
      name: string,
    ): Promise<Result<Property | null>> {
      try {
        const rows = await executeSelect(
          db,
          schema,
          (q, p: { orgId: string; name: string }) =>
            q
              .from("organization_property")
              .where((op) => op.parent_id === p.orgId && op.name === p.name),
          { orgId, name },
        );
        return {
          success: true,
          data: rows[0] ? mapPropertyFromDb(rows[0]) : null,
        };
      } catch (error) {
        logger.error("Failed to get organization property", {
          error,
          orgId,
          name,
        });
        return { success: false, error: error as Error };
      }
    },

    async setProperty(
      orgId: string,
      property: PropertyInput,
    ): Promise<Result<Property>> {
      try {
        const now = Date.now();
        // Delete existing property if it exists, then insert new one
        await executeDelete(
          db,
          schema,
          (q, p: { orgId: string; name: string }) =>
            q
              .deleteFrom("organization_property")
              .where((op) => op.parent_id === p.orgId && op.name === p.name),
          { orgId, name: property.name },
        );

        await executeInsert(
          db,
          schema,
          (
            q,
            p: {
              parent_id: string;
              name: string;
              value: string;
              hidden: boolean;
              created_at: number;
            },
          ) =>
            q.insertInto("organization_property").values({
              parent_id: p.parent_id,
              name: p.name,
              value: p.value,
              hidden: p.hidden,
              created_at: p.created_at,
            }),
          {
            parent_id: orgId,
            name: property.name,
            value:
              property.value === undefined
                ? "null"
                : JSON.stringify(property.value),
            hidden: property.hidden ?? false,
            created_at: now,
          },
        );

        return {
          success: true,
          data: {
            name: property.name,
            value: property.value,
            hidden: property.hidden ?? false,
            createdAt: now,
          },
        };
      } catch (error) {
        logger.error("Failed to set organization property", {
          error,
          orgId,
          property,
        });
        return { success: false, error: error as Error };
      }
    },

    async deleteProperty(
      orgId: string,
      name: string,
    ): Promise<Result<boolean>> {
      try {
        const rowCount = await executeDelete(
          db,
          schema,
          (q, p: { orgId: string; name: string }) =>
            q
              .deleteFrom("organization_property")
              .where((op) => op.parent_id === p.orgId && op.name === p.name),
          { orgId, name },
        );
        return { success: true, data: rowCount > 0 };
      } catch (error) {
        logger.error("Failed to delete organization property", {
          error,
          orgId,
          name,
        });
        return { success: false, error: error as Error };
      }
    },
  };
}
