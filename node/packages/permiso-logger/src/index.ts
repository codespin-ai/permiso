import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

// Custom format for console output
const consoleFormat = printf(({ level, message, timestamp, stack, context, ...meta }) => {
  const contextStr = context ? `[${context}]` : '';
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  const stackStr = stack ? `\n${stack}` : '';
  
  return `${timestamp} ${level} ${contextStr} ${message} ${metaStr}${stackStr}`;
});

// Create the base logger
const baseLogger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: combine(
    errors({ stack: true }),
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
  ),
  transports: [
    new winston.transports.Console({
      format: combine(
        colorize(),
        consoleFormat
      )
    })
  ]
});

// Export a factory function to create child loggers with context
export function createLogger(context?: string): winston.Logger {
  return baseLogger.child({ context });
}

// Export the base logger for direct use
export const logger = baseLogger;

// Re-export log levels for convenience
export const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  verbose: 4,
  debug: 5,
  silly: 6
} as const;

export type LogLevel = keyof typeof logLevels;