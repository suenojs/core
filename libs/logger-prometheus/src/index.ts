import type { LogLevel, LogOptions, LoggerPlugin } from '@sueno/logger';
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client';

export interface PrometheusPluginOptions {
  prefix?: string;
  defaultLabels?: Record<string, string>;
  buckets?: number[];
  collectDefaultMetrics?: boolean;
}

export class PrometheusPlugin implements LoggerPlugin {
  name = '@sueno/logger-prometheus';
  version = '0.1.0';

  private registry: Registry;
  private logCounter: Counter;
  private requestDuration: Histogram;
  private options: PrometheusPluginOptions;
  private loggerName: string = 'default';

  constructor(options: PrometheusPluginOptions = {}) {
    this.options = {
      prefix: 'app_',
      defaultLabels: {},
      buckets: [0.1, 0.5, 1, 2, 5],
      collectDefaultMetrics: true,
      ...options,
    };

    this.registry = new Registry();

    // Initialize metrics
    this.logCounter = new Counter({
      name: `${this.options.prefix}log_total`,
      help: 'Total number of log entries by level',
      labelNames: ['level', 'logger'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: `${this.options.prefix}http_request_duration_seconds`,
      help: 'HTTP request duration in seconds',
      labelNames: ['method', 'path', 'status'],
      buckets: this.options.buckets,
      registers: [this.registry],
    });
  }

  init(logger: {
    name: string;
    level: LogLevel;
    traceId: string;
    useAscii: boolean;
    debug: (message: string, data?: Record<string, any>, options?: LogOptions) => Promise<void>;
    info: (message: string, data?: Record<string, any>, options?: LogOptions) => Promise<void>;
    warn: (message: string, data?: Record<string, any>, options?: LogOptions) => Promise<void>;
    error: (message: string, data?: Record<string, any>, options?: LogOptions) => Promise<void>;
  }): void | Promise<void> {
    this.loggerName = logger.name || 'default';

    if (this.options.collectDefaultMetrics) {
      collectDefaultMetrics({
        prefix: this.options.prefix,
        register: this.registry,
      });
    }
  }

  hooks = {
    onLog: (level: LogLevel, message: string, data?: Record<string, any>) => {
      this.logCounter.inc({ level, logger: this.loggerName });
    },

    onRequest: (method: string, path: string, status: number, data?: Record<string, any>) => {
      if (data?.duration) {
        this.requestDuration.observe(
          { method, path, status: status.toString() },
          data.duration / 1000, // Convert to seconds
        );
      }
    },
  };

  // Plugin-specific methods
  getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  getRegistry(): Registry {
    return this.registry;
  }
}
