import { LogLevel, LogOptions } from './types';
import type { SuenoLogger } from './logger';

export class LogGroup<T extends string> {
  private logger: SuenoLogger<T>;
  private name: string;
  private startTime: Date;
  private indent: number;
  private useAscii: boolean;
  private lastMessage: {
    level: LogLevel;
    message: string;
    data?: Record<string, any>;
    options?: LogOptions;
  } | null = null;

  constructor(logger: SuenoLogger<T>, name: string, indent: number = 0) {
    this.logger = logger;
    this.name = name;
    this.startTime = new Date();
    this.indent = indent;
    this.useAscii = logger.getUseAscii();
    const prefix = this.useAscii ? '' : '│ '.repeat(Math.max(0, indent / 2));
    this.logger.info(`${prefix}╭  ${name}`, undefined, { indent: 0, isGroup: true });
  }

  private logWithTracking(
    level: LogLevel,
    message: string,
    data?: Record<string, any>,
    options?: LogOptions,
  ): void {
    // If there's a stored last message, log it first
    if (this.lastMessage) {
      const method = this.logger[this.lastMessage.level].bind(this.logger);
      method(this.lastMessage.message, this.lastMessage.data, {
        ...this.lastMessage.options,
        indent: this.indent + 2,
      });
    }
    // Store this message as the last message
    this.lastMessage = { level, message, data, options };
  }

  debug(message: string, data?: Record<string, any>, options?: LogOptions): void {
    this.logWithTracking('debug', message, data, options);
  }

  info(message: string, data?: Record<string, any>, options?: LogOptions): void {
    this.logWithTracking('info', message, data, options);
  }

  warn(message: string, data?: Record<string, any>, options?: LogOptions): void {
    this.logWithTracking('warn', message, data, options);
  }

  error(message: string, data?: Record<string, any>, options?: LogOptions): void {
    this.logWithTracking('error', message, data, options);
  }

  group(name: string): LogGroup<T> {
    // Log any stored message before creating a new group
    if (this.lastMessage) {
      const method = this.logger[this.lastMessage.level].bind(this.logger);
      method(this.lastMessage.message, this.lastMessage.data, {
        ...this.lastMessage.options,
        indent: this.indent + 2,
      });
      this.lastMessage = null;
    }
    return new LogGroup(this.logger, `[${name}]`, this.indent + 2);
  }

  end(): void {
    // Log the last message with the closing brace prefix
    if (this.lastMessage) {
      const method = this.logger[this.lastMessage.level].bind(this.logger);
      method(this.lastMessage.message, this.lastMessage.data, {
        ...this.lastMessage.options,
        indent: this.indent + 2,
        isLastInGroup: true,
      });
      this.lastMessage = null;
    }
  }
}
