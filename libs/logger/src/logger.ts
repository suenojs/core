import {
  LogLevel,
  LogOptions,
  SuenoLoggerOptions,
  Transport,
  TimeFormat,
  LogHooks,
  SuenoLogger as ISuenoLogger,
} from './types';
import { formatTime, formatMessage } from './formatters';
import { createTransport } from './transports';
import { LogGroup } from './log-group';
import fastRedact from 'fast-redact';

// Pre-allocate common strings and objects
const LEVEL_PREFIXES = {
  debug: 'debug',
  info: 'info',
  warn: 'warn',
  error: 'error',
} as const;

export class SuenoLogger<T extends string = 'ROOT'> implements ISuenoLogger<T> {
  protected name: T;
  private level: LogLevel;
  private traceId: string;
  private useAscii: boolean;
  private time: boolean;
  private timeFormat: TimeFormat;
  private transport?: Transport;
  private redact?: ReturnType<typeof fastRedact>;
  private hooks?: LogHooks;
  private performanceMode: boolean;
  private silent: boolean = false;

  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  // Pre-calculate log level checks
  private readonly enabledLevels: Record<LogLevel, boolean>;

  constructor(options: SuenoLoggerOptions = {}) {
    this.name = (options.name || 'ROOT') as T;
    this.level = options.level || 'info';
    this.traceId = options.traceId || '-';
    this.useAscii = options.useAscii ?? false;
    this.time = options.time ?? true;
    this.timeFormat = options.timeFormat || 'locale';
    this.performanceMode = options.performanceMode ?? false;
    this.silent = options.silent ?? false;

    if (options.transport) {
      this.transport = createTransport(options.transport);
    }

    if (options.redact?.paths) {
      this.redact = fastRedact({
        paths: options.redact.paths,
        censor: options.redact.censor,
        strict: options.redact.strict,
      });
    }

    this.hooks = options.hooks;

    // Pre-calculate enabled levels
    this.enabledLevels = {
      debug: this.LOG_LEVELS['debug'] >= this.LOG_LEVELS[this.level],
      info: this.LOG_LEVELS['info'] >= this.LOG_LEVELS[this.level],
      warn: this.LOG_LEVELS['warn'] >= this.LOG_LEVELS[this.level],
      error: this.LOG_LEVELS['error'] >= this.LOG_LEVELS[this.level],
    };
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    if (this.silent) return false;
    return this.enabledLevels[messageLevel];
  }

  private writeToTransport(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    options?: LogOptions,
  ): void {
    if (this.transport) {
      const redactedData = this.processData(data);
      this.transport.log(level, message, redactedData, options);
    }
  }

  private processData(data?: Record<string, any>): Record<string, any> | undefined {
    if (!data) return undefined;
    if (!this.redact) return data;
    return JSON.parse(this.redact(data));
  }

  private fastLog(level: LogLevel, message: string, data?: Record<string, any>): void {
    if (this.silent) return;
    if (this.performanceMode) {
      // Performance mode: Single console.log, minimal processing
      if (data) {
        // With data
        console.log(
          `{"level":"${LEVEL_PREFIXES[level]}","name":"${this.name}","msg":"${message}","data":${JSON.stringify(
            data,
          )}${this.time ? `,"time":${Date.now()}` : ''}}`,
        );
      } else {
        // Without data (faster)
        console.log(
          `{"level":"${LEVEL_PREFIXES[level]}","name":"${this.name}","msg":"${message}"${
            this.time ? `,"time":${Date.now()}` : ''
          }}`,
        );
      }
      return;
    }

    // Pretty mode: Use existing beautiful formatting
    const time = formatTime(this.timeFormat, this.time);
    console.log(formatMessage(level, message, this.name, time, this.useAscii, data));
  }

  async debug(
    message: string,
    data?: Record<string, any>,
    options?: LogOptions & { indent?: number },
  ): Promise<void> {
    if (this.shouldLog('debug')) {
      this.fastLog('debug', message, data);
      if (this.transport) {
        this.writeToTransport('debug', message, data, options);
      }
      await this.hooks?.onLog?.('debug', message, data);
    }
  }

  async info(
    message: string,
    data?: Record<string, any>,
    options?: LogOptions & { indent?: number },
  ): Promise<void> {
    if (!this.enabledLevels.info) return;

    this.fastLog('info', message, data);

    // Only process hooks and transport if they exist
    const hooks = this.hooks;
    const transport = this.transport;

    if (transport) {
      this.writeToTransport('info', message, data, options);
    }

    if (hooks?.onLog) {
      await hooks.onLog('info', message, data);
    }
  }

  async warn(
    message: string,
    data?: Record<string, any>,
    options?: LogOptions & { indent?: number },
  ): Promise<void> {
    if (this.shouldLog('warn')) {
      this.fastLog('warn', message, data);
      if (this.transport) {
        this.writeToTransport('warn', message, data, options);
      }
      await this.hooks?.onLog?.('warn', message, data);
    }
  }

  async error(
    message: string,
    data?: Record<string, any>,
    options?: LogOptions & { indent?: number },
  ): Promise<void> {
    if (this.shouldLog('error')) {
      this.fastLog('error', message, data);
      if (this.transport) {
        this.writeToTransport('error', message, data, options);
      }
      await this.hooks?.onLog?.('error', message, data);
      if (data instanceof Error) {
        await this.hooks?.onError?.(data, data);
      }
    }
  }

  group(name: string): LogGroup<T> {
    return new LogGroup(this, name);
  }

  // Helper method for HTTP requests
  async request(
    method: string,
    path: string,
    status: number,
    data?: Record<string, any>,
    options: LogOptions = {},
  ): Promise<void> {
    const level = status >= 400 ? 'error' : 'info';
    const requestOptions = {
      ...options,
      method,
      path,
      status,
    };

    if (this.shouldLog(level as LogLevel)) {
      const time = formatTime(this.timeFormat, this.time);
      if (!this.silent) {
        console.log(
          formatMessage(
            level.toUpperCase(),
            'HTTP Request',
            this.name,
            time,
            this.useAscii,
            data,
            requestOptions,
          ),
        );
      }
      this.writeToTransport(level as LogLevel, 'HTTP Request', data, requestOptions);
      await this.hooks?.onRequest?.(method, path, status, data);
    }
  }

  // Helper method for system status
  async system(
    status: number,
    message: string,
    data?: Record<string, any>,
    options: LogOptions = {},
  ): Promise<void> {
    if (this.silent) return;
    const level = status >= 400 ? 'error' : 'info';
    const systemOptions = {
      ...options,
      status,
    };

    if (this.shouldLog(level as LogLevel)) {
      const time = formatTime(this.timeFormat, this.time);
      if (!this.silent) {
        console.log(
          formatMessage(
            level.toUpperCase(),
            message,
            this.name,
            time,
            this.useAscii,
            data,
            systemOptions,
          ),
        );
      }

      this.writeToTransport(level as LogLevel, message, data, systemOptions);
      await this.hooks?.onSystem?.(status, message, data);
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }

  getUseAscii(): boolean {
    return this.useAscii;
  }

  getConfig(): SuenoLoggerOptions {
    return {
      name: this.name,
      level: this.level,
      silent: this.silent,
      useAscii: this.useAscii,
      time: this.time,
      timeFormat: this.timeFormat,
      performanceMode: this.performanceMode,
      hooks: this.hooks,
    };
  }
}
