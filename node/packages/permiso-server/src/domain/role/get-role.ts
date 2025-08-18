import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";
import type { RoleDbRow, RoleWithProperties } from "../../types.js";
import { mapRoleFromDb } from "../../mappers.js";
import { getRoleProperties } from "./get-role-properties.js";

const logger = createLogger("permiso-server:roles");

export async function getRole(
  db: Database,
  orgId: string,
  roleId: string,
): Promise<Result<RoleWithProperties | null>> {
  try {
    const roleRow = await db.oneOrNone<RoleDbRow>(
      `SELECT * FROM role WHERE id = $(roleId) AND org_id = $(orgId)`,
      { roleId, orgId },
    );

    if (!roleRow) {
      return { success: true, data: null };
    }

    const propertiesResult = await getRoleProperties(db, orgId, roleId, false);
    if (!propertiesResult.success) {
      throw propertiesResult.error;
    }

    const role = mapRoleFromDb(roleRow);

    const result: RoleWithProperties = {
      ...role,
      properties: propertiesResult.data.reduce(
        (acc, prop) => {
          acc[prop.name] = prop.value;
          return acc;
        },
        {} as Record<string, unknown>,
      ),
    };

    return { success: true, data: result };
  } catch (error) {
    logger.error("Failed to get role", { error, orgId, roleId });
    return { success: false, error: error as Error };
  }
}
