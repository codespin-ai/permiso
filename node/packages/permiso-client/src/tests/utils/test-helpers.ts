import { PermisoConfig } from "../../types.js";
import { testLogger } from "@codespin/permiso-test-utils";

export function getTestConfig(): PermisoConfig {
  return {
    endpoint: "http://localhost:5003",
    apiKey: "test-token", // Bearer token for authentication
    // No orgId = ROOT context for cross-org operations
    timeout: 30000,
    logger: testLogger,
  };
}

export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}
