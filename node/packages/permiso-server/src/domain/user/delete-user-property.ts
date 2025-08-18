import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { Database } from "@codespin/permiso-db";

const logger = createLogger("permiso-server:users");

export async function deleteUserProperty(
  db: Database,
  orgId: string,
  userId: string,
  name: string,
): Promise<Result<boolean>> {
  try {
    const result = await db.result(
      `DELETE FROM user_property WHERE parent_id = $(userId) AND org_id = $(orgId) AND name = $(name)`,
      { userId, orgId, name },
    );
    return { success: true, data: result.rowCount > 0 };
  } catch (error) {
    logger.error("Failed to delete user property", {
      error,
      orgId,
      userId,
      name,
    });
    return { success: false, error: error as Error };
  }
}
