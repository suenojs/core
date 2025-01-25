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

export interface SuenoLoggerOptions {
  name?: string;
  level?: LogLevel;
  traceId?: string;
  useAscii?: boolean;
  time?: boolean;
  timeFormat?: TimeFormat;
  transport?: TransportConfig;
  redact?: RedactOptions;
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
