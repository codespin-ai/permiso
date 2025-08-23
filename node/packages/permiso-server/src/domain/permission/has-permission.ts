import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";
import type { DataContext } from "../data-context.js";
import { getEffectivePermissions } from "./get-effective-permissions.js";

const logger = createLogger("permiso-server:permissions");

export async function hasPermission(
  ctx: DataContext,
  orgId: string,
  userId: string,
  resourceId: string,
  action: string,
): Promise<Result<boolean>> {
  try {
    const result = await getEffectivePermissions(
      ctx,
      orgId,
      userId,
      resourceId,
      action,
    );

    if (!result.success) {
      return { success: false, error: result.error };
    }

    return { success: true, data: result.data.length > 0 };
  } catch (error) {
    logger.error("Failed to check permission", {
      error,
      orgId,
      userId,
      resourceId,
      action,
    });
    return { success: false, error: error as Error };
  }
}
