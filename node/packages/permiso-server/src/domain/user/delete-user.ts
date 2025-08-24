import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:users");

export async function deleteUser(
  ctx: DataContext,
  userId: string,
): Promise<Result<boolean>> {
  try {
    await ctx.db.none(`DELETE FROM "user" WHERE id = $(userId)`, { userId });
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to delete user", { error, userId });
    return { success: false, error: error as Error };
  }
}
