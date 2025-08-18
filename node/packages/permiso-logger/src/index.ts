import { pino } from "pino";

const baseLogger = pino({
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV === "development"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "HH:MM:ss Z",
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

/**
 * Create a logger instance with a specific name
 *
 * @param name - The name/component for the logger
 * @returns A pino logger instance
 *
 * @example
 * const logger = createLogger('permiso-server');
 * logger.info('Server started', { port: 5001 });
 */
export function createLogger(name: string) {
  return baseLogger.child({ name });
}

export type Logger = ReturnType<typeof createLogger>;
