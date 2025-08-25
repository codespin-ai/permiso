import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import type {
  OrganizationDbRow,
  OrganizationWithProperties,
} from "../../types.js";
import { mapOrganizationFromDb } from "../../mappers.js";
import { getOrganizationProperties } from "./get-organization-properties.js";

const logger = createLogger("permiso-server:organizations");

export async function getOrganization(
  ctx: DataContext,
  id: string,
): Promise<Result<OrganizationWithProperties | null>> {
  try {
    // Use ROOT access for cross-organization queries
    const rootDb = ctx.db.upgradeToRoot?.("Get organization by ID") || ctx.db;

    const orgRow = await rootDb.oneOrNone<OrganizationDbRow>(
      `SELECT * FROM organization WHERE id = $(id)`,
      { id },
    );

    if (!orgRow) {
      return { success: true, data: null };
    }

    // Use rootDb for getting properties too
    const rootCtx = { ...ctx, db: rootDb };
    const propsResult = await getOrganizationProperties(rootCtx, id, false);
    if (!propsResult.success) {
      throw propsResult.error;
    }
    const properties = propsResult.data;
    const org = mapOrganizationFromDb(orgRow);

    const result: OrganizationWithProperties = {
      ...org,
      properties: properties.reduce(
        (acc, prop) => {
          acc[prop.name] = prop.value;
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to get organization", { error, id });
    return { success: false, error: error as Error };
  }
}
