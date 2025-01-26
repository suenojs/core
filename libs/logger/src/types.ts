// import { SuenoLogger } from './logger';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export type TimeFormat = 'iso' | 'epoch' | 'unix' | 'locale' | 'none';

export interface RedactOptions {
  paths: string[];
  censor?: string;
  strict?: boolean;
}

// Options that can be passed as the third parameter to any log method
export interface LogOptions {
  traceId?: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  isGroup?: boolean;
  isGroupEnd?: boolean;
  isLastInGroup?: boolean;
}

export interface LogHooks {
  onLog?: (level: LogLevel, message: string, data?: Record<string, any>) => void | Promise<void>;
  onError?: (error: Error, data?: Record<string, any>) => void | Promise<void>;
  onRequest?: (
    method: string,
    path: string,
    status: number,
    data?: Record<string, any>
  ) => void | Promise<void>;
  onSystem?: (status: number, message: string, data?: Record<string, any>) => void | Promise<void>;
}

export interface SuenoLoggerOptions {
  name?: string;
  level?: LogLevel;
  traceId?: string;
  useAscii?: boolean;
  time?: boolean;
  timeFormat?: TimeFormat;
  transport?: TransportConfig;
  redact?: RedactOptions;
  hooks?: LogHooks;
  plugins?: LoggerPlugin[];
}

export interface Transport {
  log(level: LogLevel, message: string, data?: Record<string, any>, options?: LogOptions): void;
}

export type TransportType = 'file';

export interface FileTransportConfig {
  type: 'file';
  filename: string;
  dirname?: string;
  maxSize?: number;
  maxFiles?: number;
}

export type TransportConfig = FileTransportConfig;

export interface SuenoLogger<T extends string = 'ROOT'> {
  debug(message: string, data?: Record<string, any>, options?: LogOptions): Promise<void>;
  info(message: string, data?: Record<string, any>, options?: LogOptions): Promise<void>;
  warn(message: string, data?: Record<string, any>, options?: LogOptions): Promise<void>;
  error(message: string, data?: Record<string, any>, options?: LogOptions): Promise<void>;
  request(
    method: string,
    path: string,
    status: number,
    data?: Record<string, any>,
    options?: LogOptions
  ): Promise<void>;
  system(
    status: number,
    message: string,
    data?: Record<string, any>,
    options?: LogOptions
  ): Promise<void>;
  setLevel(level: LogLevel): void;
  setTraceId(traceId: string): void;
  getUseAscii(): boolean;
}

export interface LoggerPlugin {
  name: string;
  version: string;
  init?: (logger: {
    name: string;
    level: LogLevel;
    traceId: string;
    useAscii: boolean;
    debug: (message: string, data?: Record<string, any>, options?: LogOptions) => Promise<void>;
    info: (message: string, data?: Record<string, any>, options?: LogOptions) => Promise<void>;
    warn: (message: string, data?: Record<string, any>, options?: LogOptions) => Promise<void>;
    error: (message: string, data?: Record<string, any>, options?: LogOptions) => Promise<void>;
  }) => void | Promise<void>;
  hooks?: {
    onLog?: (level: LogLevel, message: string, data?: Record<string, any>) => void;
    onRequest?: (method: string, path: string, status: number, data?: Record<string, any>) => void;
  };
}
