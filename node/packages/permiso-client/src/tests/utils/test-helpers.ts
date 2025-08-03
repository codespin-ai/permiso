import { PermisoConfig } from '../../types.js';

export function getTestConfig(): PermisoConfig {
  return {
    endpoint: 'http://localhost:5003',
    timeout: 30000,
  };
}

export function generateTestId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(7)}`;
}