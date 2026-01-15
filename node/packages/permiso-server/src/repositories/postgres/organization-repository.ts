/**
 * PostgreSQL Organization Repository
 *
 * Organizations are not RLS-protected - they are globally accessible.
 */

import { createLogger } from "@codespin/permiso-logger";
import { sql, type Database } from "@codespin/permiso-db";
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
import type { OrganizationDbRow, PropertyDbRow } from "../../types.js";

const logger = createLogger("permiso-server:repos:postgres:organization");

function mapOrganizationFromDb(row: OrganizationDbRow): Organization {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapPropertyFromDb(row: PropertyDbRow): Property {
  return {
    name: row.name,
    value: row.value,
    hidden: row.hidden,
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
        const org = await db.tx(async (t) => {
          const now = Date.now();
          const params = {
            id: input.id,
            name: input.name,
            description: input.description ?? null,
            created_at: now,
            updated_at: now,
          };

          const orgRow = await t.one<OrganizationDbRow>(
            `${sql.insert("organization", params)} RETURNING *`,
            params,
          );

          if (input.properties && input.properties.length > 0) {
            for (const prop of input.properties) {
              const propParams = {
                parent_id: input.id,
                name: prop.name,
                value:
                  prop.value === undefined ? null : JSON.stringify(prop.value),
                hidden: prop.hidden ?? false,
                created_at: now,
              };
              await t.none(
                sql.insert("organization_property", propParams),
                propParams,
              );
            }
          }

          return orgRow;
        });

        return { success: true, data: mapOrganizationFromDb(org) };
      } catch (error) {
        logger.error("Failed to create organization", { error, input });
        return { success: false, error: error as Error };
      }
    },

    async getById(orgId: string): Promise<Result<Organization | null>> {
      try {
        const row = await db.oneOrNone<OrganizationDbRow>(
          `SELECT * FROM organization WHERE id = $(orgId)`,
          { orgId },
        );
        return { success: true, data: row ? mapOrganizationFromDb(row) : null };
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
        let whereClause = "";
        const params: Record<string, unknown> = {};

        if (filter?.name) {
          whereClause = "WHERE name ILIKE $(name)";
          params.name = `%${filter.name}%`;
        }

        const countResult = await db.one<{ count: string }>(
          `SELECT COUNT(*) as count FROM organization ${whereClause}`,
          params,
        );
        const totalCount = parseInt(countResult.count, 10);

        let query = `SELECT * FROM organization ${whereClause} ORDER BY created_at DESC`;
        if (pagination?.first) {
          query += ` LIMIT $(limit)`;
          params.limit = pagination.first;
        }

        const rows = await db.manyOrNone<OrganizationDbRow>(query, params);

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
        const updateParams: Record<string, unknown> = { updated_at: now };

        if (input.name !== undefined) {
          updateParams.name = input.name;
        }
        if (input.description !== undefined) {
          updateParams.description = input.description;
        }

        const row = await db.one<OrganizationDbRow>(
          `${sql.update("organization", updateParams)} WHERE id = $(orgId) RETURNING *`,
          { ...updateParams, orgId },
        );

        return { success: true, data: mapOrganizationFromDb(row) };
      } catch (error) {
        logger.error("Failed to update organization", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async delete(orgId: string): Promise<Result<boolean>> {
      try {
        await db.tx(async (t) => {
          // Delete all related data
          await t.none(
            `DELETE FROM organization_property WHERE parent_id = $(orgId)`,
            { orgId },
          );
          await t.none(`DELETE FROM user_permission WHERE org_id = $(orgId)`, {
            orgId,
          });
          await t.none(`DELETE FROM role_permission WHERE org_id = $(orgId)`, {
            orgId,
          });
          await t.none(`DELETE FROM user_property WHERE org_id = $(orgId)`, {
            orgId,
          });
          await t.none(`DELETE FROM role_property WHERE org_id = $(orgId)`, {
            orgId,
          });
          await t.none(`DELETE FROM user_role WHERE org_id = $(orgId)`, {
            orgId,
          });
          await t.none(`DELETE FROM "user" WHERE org_id = $(orgId)`, { orgId });
          await t.none(`DELETE FROM role WHERE org_id = $(orgId)`, { orgId });
          await t.none(`DELETE FROM resource WHERE org_id = $(orgId)`, {
            orgId,
          });
          await t.none(`DELETE FROM organization WHERE id = $(orgId)`, {
            orgId,
          });
        });
        return { success: true, data: true };
      } catch (error) {
        logger.error("Failed to delete organization", { error, orgId });
        return { success: false, error: error as Error };
      }
    },

    async getProperties(orgId: string): Promise<Result<Property[]>> {
      try {
        const rows = await db.manyOrNone<PropertyDbRow>(
          `SELECT * FROM organization_property WHERE parent_id = $(orgId)`,
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
        const row = await db.oneOrNone<PropertyDbRow>(
          `SELECT * FROM organization_property WHERE parent_id = $(orgId) AND name = $(name)`,
          { orgId, name },
        );
        return { success: true, data: row ? mapPropertyFromDb(row) : null };
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
        const params = {
          parent_id: orgId,
          name: property.name,
          value:
            property.value === undefined
              ? null
              : JSON.stringify(property.value),
          hidden: property.hidden ?? false,
          created_at: now,
        };

        await db.none(
          `INSERT INTO organization_property (parent_id, name, value, hidden, created_at)
           VALUES ($(parent_id), $(name), $(value), $(hidden), $(created_at))
           ON CONFLICT (parent_id, name)
           DO UPDATE SET value = $(value), hidden = $(hidden)`,
          params,
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
        await db.none(
          `DELETE FROM organization_property WHERE parent_id = $(orgId) AND name = $(name)`,
          { orgId, name },
        );
        return { success: true, data: true };
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
