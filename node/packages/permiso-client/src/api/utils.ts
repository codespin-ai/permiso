import { PermisoConfig } from "../types.js";

/**
 * Build headers for GraphQL requests
 */
export function buildHeaders(config: PermisoConfig): Record<string, string> {
  const headers: Record<string, string> = {};

  if (config.orgId) {
    headers["x-org-id"] = config.orgId;
  }

  if (config.apiKey) {
    headers["authorization"] = `Bearer ${config.apiKey}`;
  }

  return headers;
}
