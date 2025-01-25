import { SuenoLogger } from './logger';
import type { SuenoLoggerOptions } from './types';

export * from './types';
export * from './formatters';
export * from './log-group';
export * from './logger';

// Export specific items from transports to avoid conflicts
export { createTransport } from './transports';

export const createLogger = <T extends string = 'ROOT'>(
  options?: SuenoLoggerOptions
): SuenoLogger<T> => {
  return new SuenoLogger<T>(options);
};
