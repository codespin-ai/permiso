import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";

const logger = createLogger("BearerAuth");

export type BearerAuthConfig = {
  enabled: boolean;
  token?: string;
};

export function getBearerAuthConfig(): BearerAuthConfig {
  const token = process.env.PERMISO_API_KEY;
  const enabled = process.env.PERMISO_API_KEY_ENABLED === "true" || !!token;

  return {
    enabled,
    token,
  };
}

export function extractBearerToken(
  authHeader: string | undefined,
): string | undefined {
  if (!authHeader) {
    return undefined;
  }

  if (authHeader.toLowerCase().startsWith("bearer ")) {
    return authHeader.slice(7);
  }

  return undefined;
}

export function validateBearerToken(
  authHeader: string | undefined,
  config: BearerAuthConfig,
): Result<void, Error> {
  if (!config.enabled) {
    return { success: true, data: undefined };
  }

  if (!config.token) {
    logger.error(
      "Bearer authentication is enabled but PERMISO_API_KEY is not set",
    );
    return {
      success: false,
      error: new Error(
        "Server configuration error: Bearer token not configured",
      ),
    };
  }

  const token = extractBearerToken(authHeader);

  if (!token) {
    return {
      success: false,
      error: new Error("Bearer token required but not provided"),
    };
  }

  if (token !== config.token) {
    return {
      success: false,
      error: new Error("Invalid Bearer token"),
    };
  }

  return { success: true, data: undefined };
}
