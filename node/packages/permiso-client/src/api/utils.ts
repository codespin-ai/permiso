import { PermisoConfig } from "../types.js";

/**
 * Build headers for GraphQL requests
 */
export function buildHeaders(config: PermisoConfig): Record<string, string> {
  const headers: Record<string, string> = {
    "x-org-id": config.orgId,
  };

  if (config.apiKey) {
    headers["x-api-key"] = config.apiKey;
  }

  return headers;
}
