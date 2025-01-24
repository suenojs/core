import pino from 'pino';
import chalk from 'chalk';

/*
 Cool pattern:
```
[2025-01-24T22:57:59.756Z] {TRACE_ID} [LEVEL] {MODULE} - Method: GET, Path: /hello, Status: 200, Duration: 12ms, Details: Additional context
```;
*/
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogDetails {
  traceId?: string;
  method?: string;
  path?: string;
  status?: number;
  duration?: number;
  details?: string | Record<string, unknown>;
}

interface LoggerOptions {
  name?: string;
  level?: LogLevel;
  traceId?: string;
}

class SuenoLogger {
  private name: string;
  private level: LogLevel;
  private traceId: string;
  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: LoggerOptions = {}) {
    this.name = options.name || 'ROOT';
    this.level = options.level || 'info';
    this.traceId = options.traceId || '-';
  }

  private formatTime(): string {
    const now = new Date();
    return now.toISOString();
  }

  private formatDetails(details: LogDetails): string {
    const parts: string[] = [];

    // Always format in this exact order: Method, Path, Status, Duration, Details
    if (details.method) {
      parts.push(`Method: ${details.method}`);
    }
    if (details.path) {
      parts.push(`Path: ${details.path}`);
    }
    if (details.status !== undefined) {
      parts.push(`Status: ${details.status}`);
    }

    // Include duration if provided
    if (details.duration !== undefined) {
      parts.push(`Duration: ${details.duration}ms`);
    }

    if (details.details) {
      const detailsStr =
        typeof details.details === 'string'
          ? details.details
          : JSON.stringify({ ...details.details, duration: undefined }); // Remove duration from details object
      if (detailsStr !== '{}') {
        parts.push(`Details: ${detailsStr}`);
      }
    }

    return parts.join(', ');
  }

  private formatMessage(level: string, message: string, details?: LogDetails): string {
    const time = this.formatTime();
    const traceId = details?.traceId || this.traceId;
    const coloredLevel = this.getLevelColor(level);

    // Exact format: [timestamp] {trace_id} [level] {module} - details
    const prefix = `[${time}] {${traceId}} [${coloredLevel}] {${chalk.cyan(this.name)}} -`;

    if (details) {
      return `${prefix} ${this.formatDetails(details)}`;
    }

    return `${prefix} ${message}`;
  }

  private getLevelColor(level: string): string {
    switch (level.toLowerCase()) {
      case 'error':
        return chalk.red(level);
      case 'warn':
        return chalk.yellow(level);
      case 'info':
        return chalk.green(level);
      case 'debug':
        return chalk.blue(level);
      default:
        return chalk.white(level);
    }
  }

  private shouldLog(messageLevel: LogLevel): boolean {
    return this.LOG_LEVELS[messageLevel] >= this.LOG_LEVELS[this.level];
  }

  // System level logging (with status codes)
  system(status: number, message: string): void {
    // System logs are always shown regardless of log level
    const coloredStatus = this.getStatusColor(status);
    console.log(this.formatMessage(coloredStatus, message));
  }

  private getStatusColor(status: number): string {
    if (status >= 500) return chalk.red(`${status}`);
    if (status >= 400) return chalk.red(`${status}`);
    if (status >= 300) return chalk.yellow(`${status}`);
    if (status >= 200) return chalk.green(`${status}`);
    return chalk.blue(`${status}`);
  }

  // HTTP request logging
  request(
    method: string,
    path: string,
    status: number,
    details?: string | Record<string, unknown>
  ): void {
    const level = status >= 400 ? 'error' : 'info';
    if (this.shouldLog(level as LogLevel)) {
      const logDetails: LogDetails = {
        method,
        path,
        status,
        duration: typeof details === 'object' ? (details.duration as number) : undefined,
        details: typeof details === 'object' ? { ...details, duration: undefined } : details,
      };
      console.log(this.formatMessage(level.toUpperCase(), '', logDetails));
    }
  }

  // Developer friendly logging methods
  debug(message: string, details?: LogDetails): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('DEBUG', message, details));
    }
  }

  info(message: string, details?: LogDetails): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('INFO', message, details));
    }
  }

  warn(message: string, details?: LogDetails): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('WARN', message, details));
    }
  }

  error(message: string, details?: LogDetails): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('ERROR', message, details));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }

  setTraceId(traceId: string): void {
    this.traceId = traceId;
  }
}

export const createLogger = (options?: LoggerOptions): SuenoLogger => {
  return new SuenoLogger(options);
};

export type { LoggerOptions, LogLevel };
export { SuenoLogger };
