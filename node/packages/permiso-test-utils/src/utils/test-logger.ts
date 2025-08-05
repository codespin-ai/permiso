// Test logger that respects VERBOSE_TESTS environment variable
const isVerbose = process.env.VERBOSE_TESTS === 'true';

export type Logger = {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
};

export const testLogger: Logger = {
  debug: isVerbose ? (...args: unknown[]) => console.info('[DEBUG]', ...args) : () => {},
  info: isVerbose ? console.info : () => {},
  warn: isVerbose ? console.warn : () => {},
  error: isVerbose ? console.error : () => {},
};

export const createTestLogger = (prefix?: string): Logger => {
  const formatMessage = (_level: string, args: unknown[]) => {
    if (prefix) {
      return [`[${prefix}]`, ...args];
    }
    return args;
  };

  return {
    debug: isVerbose ? (...args) => console.info(...formatMessage('DEBUG', args)) : () => {},
    info: isVerbose ? (...args) => console.info(...formatMessage('INFO', args)) : () => {},
    warn: isVerbose ? (...args) => console.warn(...formatMessage('WARN', args)) : () => {},
    error: isVerbose ? (...args) => console.error(...formatMessage('ERROR', args)) : () => {},
  };
};