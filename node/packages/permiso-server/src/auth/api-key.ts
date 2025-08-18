import { createLogger } from "@codespin/permiso-logger";
import { Result } from "@codespin/permiso-core";

const logger = createLogger("ApiKeyAuth");

export type ApiKeyConfig = {
  enabled: boolean;
  apiKey?: string;
  headerName: string;
};

export function getApiKeyConfig(): ApiKeyConfig {
  const apiKey = process.env.PERMISO_API_KEY;
  const enabled = process.env.PERMISO_API_KEY_ENABLED === "true" || !!apiKey;

  return {
    enabled,
    apiKey,
    headerName: "x-api-key",
  };
}

export function validateApiKey(
  requestApiKey: string | undefined,
  config: ApiKeyConfig,
): Result<void, Error> {
  if (!config.enabled) {
    return { success: true, data: undefined };
  }

  if (!config.apiKey) {
    logger.error(
      "API key authentication is enabled but PERMISO_API_KEY is not set",
    );
    return {
      success: false,
      error: new Error("Server configuration error: API key not configured"),
    };
  }

  if (!requestApiKey) {
    return {
      success: false,
      error: new Error("API key required but not provided"),
    };
  }

  if (requestApiKey !== config.apiKey) {
    return {
      success: false,
      error: new Error("Invalid API key"),
    };
  }

  return { success: true, data: undefined };
}
