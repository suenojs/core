import { LogLevel, LogOptions, SuenoLoggerOptions, Transport, TimeFormat } from './types';
import { formatTime, formatMessage } from './formatters';
import { createTransport } from './transports';
import { LogGroup } from './log-group';
import fastRedact from 'fast-redact';

export class SuenoLogger<T extends string = 'ROOT'> {
  protected name: T;
  private level: LogLevel;
  private traceId: string;
  private useAscii: boolean;
  private time: boolean;
  private timeFormat: TimeFormat;
  private transport?: Transport;
  private redact?: ReturnType<typeof fastRedact>;

  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: SuenoLoggerOptions = {}) {
    this.name = (options.name || 'ROOT') as T;
    this.level = options.level || 'info';
    this.traceId = options.traceId || '-';
    this.useAscii = options.useAscii ?? false;
    this.time = options.time ?? true;
    this.timeFormat = options.timeFormat || 'locale';

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
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    return this.LOG_LEVELS[messageLevel] >= this.LOG_LEVELS[this.level];
  }

  private writeToTransport(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    options?: LogOptions
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

  debug(
    message: string,
    data?: Record<string, any>,
    options?: LogOptions & { indent?: number }
  ): void {
    if (this.shouldLog('debug')) {
      const time = formatTime(this.timeFormat, this.time);
      const redactedData = this.processData(data);
      console.log(
        formatMessage('DEBUG', message, this.name, time, this.useAscii, redactedData, options)
      );
      this.writeToTransport('debug', message, data, options);
    }
  }

  info(
    message: string,
    data?: Record<string, any>,
    options?: LogOptions & { indent?: number }
  ): void {
    if (this.shouldLog('info')) {
      const time = formatTime(this.timeFormat, this.time);
      const redactedData = this.processData(data);
      console.log(
        formatMessage('INFO', message, this.name, time, this.useAscii, redactedData, options)
      );
      this.writeToTransport('info', message, data, options);
    }
  }

  warn(
    message: string,
    data?: Record<string, any>,
    options?: LogOptions & { indent?: number }
  ): void {
    if (this.shouldLog('warn')) {
      const time = formatTime(this.timeFormat, this.time);
      const redactedData = this.processData(data);
      console.warn(
        formatMessage('WARN', message, this.name, time, this.useAscii, redactedData, options)
      );
      this.writeToTransport('warn', message, data, options);
    }
  }

  error(
    message: string,
    data?: Record<string, any>,
    options?: LogOptions & { indent?: number }
  ): void {
    if (this.shouldLog('error')) {
      const time = formatTime(this.timeFormat, this.time);
      const redactedData = this.processData(data);
      console.error(
        formatMessage('ERROR', message, this.name, time, this.useAscii, redactedData, options)
      );
      this.writeToTransport('error', message, data, options);
    }
  }

  group(name: string): LogGroup<T> {
    return new LogGroup(this, name);
  }

  // Helper method for HTTP requests
  request(
    method: string,
    path: string,
    status: number,
    data?: Record<string, any>,
    options: LogOptions = {}
  ): void {
    const level = status >= 400 ? 'error' : 'info';
    const requestOptions = {
      ...options,
      method,
      path,
      status,
    };

    if (this.shouldLog(level as LogLevel)) {
      const time = formatTime(this.timeFormat, this.time);
      console.log(
        formatMessage(
          level.toUpperCase(),
          'HTTP Request',
          this.name,
          time,
          this.useAscii,
          data,
          requestOptions
        )
      );
      this.writeToTransport(level as LogLevel, 'HTTP Request', data, requestOptions);
    }
  }

  // Helper method for system status
  system(
    status: number,
    message: string,
    data?: Record<string, any>,
    options: LogOptions = {}
  ): void {
    const level = status >= 400 ? 'error' : 'info';
    const systemOptions = {
      ...options,
      status,
    };

    if (this.shouldLog(level as LogLevel)) {
      const time = formatTime(this.timeFormat, this.time);
      console.log(
        formatMessage(
          level.toUpperCase(),
          message,
          this.name,
          time,
          this.useAscii,
          data,
          systemOptions
        )
      );
      this.writeToTransport(level as LogLevel, message, data, systemOptions);
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
}
