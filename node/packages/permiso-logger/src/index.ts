type LogLevel = "trace" | "debug" | "info" | "warn" | "error" | "fatal";

const LOG_LEVELS: Record<LogLevel, number> = {
  trace: 10,
  debug: 20,
  info: 30,
  warn: 40,
  error: 50,
  fatal: 60,
};

const currentLevel: LogLevel =
  (process.env.LOG_LEVEL as LogLevel | undefined) || "info";
const currentLevelValue = LOG_LEVELS[currentLevel];

function shouldLog(level: LogLevel): boolean {
  return LOG_LEVELS[level] >= currentLevelValue;
}

function formatMessage(
  level: string,
  name: string,
  msg: string,
  data?: unknown,
): string {
  const timestamp = new Date().toISOString();
  const dataStr = data ? ` ${JSON.stringify(data)}` : "";
  return `[${timestamp}] ${level.toUpperCase()} (${name}): ${msg}${dataStr}`;
}

export type Logger = {
  trace(msg: string, data?: unknown): void;
  debug(msg: string, data?: unknown): void;
  info(msg: string, data?: unknown): void;
  warn(msg: string, data?: unknown): void;
  error(msg: string, data?: unknown): void;
  fatal(msg: string, data?: unknown): void;
};

/**
 * Create a logger instance with a specific name
 *
 * @param name - The name/component for the logger
 * @returns A logger instance
 *
 * @example
 * const logger = createLogger('permiso-server');
 * logger.info('Server started', { port: 5001 });
 */
export function createLogger(name: string): Logger {
  return {
    trace: (msg: string, data?: unknown) => {
      if (shouldLog("trace")) {
        console.info(formatMessage("trace", name, msg, data));
      }
    },
    debug: (msg: string, data?: unknown) => {
      if (shouldLog("debug")) {
        console.info(formatMessage("debug", name, msg, data));
      }
    },
    info: (msg: string, data?: unknown) => {
      if (shouldLog("info")) {
        console.info(formatMessage("info", name, msg, data));
      }
    },
    warn: (msg: string, data?: unknown) => {
      if (shouldLog("warn")) {
        console.warn(formatMessage("warn", name, msg, data));
      }
    },
    error: (msg: string, data?: unknown) => {
      if (shouldLog("error")) {
        console.error(formatMessage("error", name, msg, data));
      }
    },
    fatal: (msg: string, data?: unknown) => {
      if (shouldLog("fatal")) {
        console.error(formatMessage("fatal", name, msg, data));
      }
    },
  };
}
