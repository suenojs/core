import pino from 'pino';
import chalk from 'chalk';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerOptions {
  name?: string;
  level?: LogLevel;
}

class SuenoLogger {
  private name: string;
  private level: LogLevel;
  private readonly LOG_LEVELS: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3,
  };

  constructor(options: LoggerOptions = {}) {
    this.name = options.name || 'ROOT';
    this.level = options.level || 'info';
  }

  private formatTime(): string {
    const now = new Date();
    return chalk.gray(now.toISOString());
  }

  private formatMessage(level: string, message: string): string {
    const time = this.formatTime();
    const coloredLevel = this.getLevelColor(level);
    return `[${time}] {${chalk.cyan(this.name)}} - [${coloredLevel}] ${message}`;
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

  // Developer friendly logging methods
  debug(message: string): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('DEBUG', message));
    }
  }

  info(message: string): void {
    if (this.shouldLog('info')) {
      console.log(this.formatMessage('INFO', message));
    }
  }

  warn(message: string): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('WARN', message));
    }
  }

  error(message: string): void {
    if (this.shouldLog('error')) {
      console.error(this.formatMessage('ERROR', message));
    }
  }

  setLevel(level: LogLevel): void {
    this.level = level;
  }
}

export const createLogger = (options?: LoggerOptions): SuenoLogger => {
  return new SuenoLogger(options);
};

export type { LoggerOptions, LogLevel };
export { SuenoLogger };
