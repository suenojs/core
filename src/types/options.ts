import type { CorsOptions, ServeOptions } from './http';
import type { LogLevel, SuenoLogger } from '../logger';

export interface SuenoOptions {
  logger?: boolean | SuenoLogger;
  logLevel?: LogLevel;
  trustProxy?: boolean;
  jsonLimit?: string;
  cors?: CorsOptions;
}

export type { ServeOptions };
