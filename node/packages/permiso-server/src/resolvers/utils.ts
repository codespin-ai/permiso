import type { Result } from '@codespin/permiso-core';

export function unwrapResult<T>(result: Result<T>): T {
  if (result.success) {
    return result.data;
  }
  throw result.error;
}