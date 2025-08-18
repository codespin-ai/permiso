/**
 * Test logger that respects VERBOSE_TESTS environment variable
 *
 * By default, tests run silently. Set VERBOSE_TESTS=true to see all logs.
 */

export type Logger = {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
};

const isVerbose = process.env.VERBOSE_TESTS === "true";

export const testLogger: Logger = {
  debug: isVerbose ? console.debug : () => {},
  info: isVerbose ? console.info : () => {},
  warn: isVerbose ? console.warn : () => {},
  error: isVerbose ? console.error : () => {},
};

// Default logger that always logs (for backward compatibility)
export const consoleLogger: Logger = {
  debug: console.debug,
  info: console.info,
  warn: console.warn,
  error: console.error,
};
