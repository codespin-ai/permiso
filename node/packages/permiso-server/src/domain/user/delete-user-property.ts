import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:users");

export async function deleteUserProperty(
  ctx: DataContext,
  userId: string,
  name: string,
): Promise<Result<boolean>> {
  try {
    const result = await ctx.db.result(
      `DELETE FROM user_property WHERE parent_id = $(userId) AND name = $(name)`,
      { userId, name },
    );
    return { success: true, data: result.rowCount > 0 };
  } catch (error) {
    logger.error("Failed to delete user property", {
      error,
      userId,
      name,
    });
    return { success: false, error: error as Error };
  }
}
