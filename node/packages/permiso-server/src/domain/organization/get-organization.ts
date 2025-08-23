import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../context.js";
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
    const orgRow = await ctx.db.oneOrNone<OrganizationDbRow>(
      `SELECT * FROM organization WHERE id = $(id)`,
      { id },
    );

    if (!orgRow) {
      return { success: true, data: null };
    }

    const propsResult = await getOrganizationProperties(ctx, id, false);
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
