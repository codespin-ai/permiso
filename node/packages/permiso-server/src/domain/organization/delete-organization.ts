import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";

const logger = createLogger("permiso-server:organizations");

export async function deleteOrganization(
  ctx: DataContext,
  id: string,
): Promise<Result<boolean>> {
  try {
    // Use ROOT access for organization deletion
    const rootDb = ctx.db.upgradeToRoot?.("Delete organization") || ctx.db;

    await rootDb.none(`DELETE FROM organization WHERE id = $(id)`, { id });
    return { success: true, data: true };
  } catch (error) {
    logger.error("Failed to delete organization", { error, id });
    return { success: false, error: error as Error };
  }
}
