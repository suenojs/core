import { SuenoLogger } from './logger';
import type { SuenoLoggerOptions, LogHooks, LogLevel, LogOptions } from './types';

export type { SuenoLoggerOptions, LogHooks, LogLevel, LogOptions } from './types';
export type { LoggerPlugin } from './types';

export * from './formatters';
export * from './log-group';
export * from './logger';

// Export specific items from transports to avoid conflicts
export { createTransport } from './transports';

// Create default logger instance
export const logger = new SuenoLogger();

// Helper to configure the default logger
export const configure = (options: SuenoLoggerOptions): void => {
  Object.assign(logger, new SuenoLogger(options));
};

// Helper to add hooks
export const addHooks = (hooks: LogHooks): void => {
  configure({ hooks });
};

// Keep createLogger for custom instances
export const createLogger = <T extends string = 'ROOT'>(
  options?: SuenoLoggerOptions,
): SuenoLogger<T> => {
  return new SuenoLogger<T>(options);
};
