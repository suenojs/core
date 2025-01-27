import winston from 'winston';
import pino from 'pino';
import { createLogger } from '@sueno/logger';

// Setup silent loggers
export const suenoLogger = createLogger({
  name: 'BENCH',
  time: false,
  hooks: undefined,
  silent: true,
});

export const suenoPerformanceLogger = createLogger({
  name: 'BENCH',
  time: false,
  hooks: undefined,
  performanceMode: true,
  silent: true,
});

export const winstonLogger = winston.createLogger({
  transports: [new winston.transports.Console({ silent: true })],
});

export const pinoLogger = pino({ enabled: false });

// Test data
export const simpleMessage = 'This is a simple log message';
export const complexData = {
  userId: 123,
  action: 'benchmark',
  metadata: {
    timestamp: Date.now(),
    environment: 'test',
    details: {
      browser: 'Chrome',
      version: '100.0.0',
      platform: 'macOS',
    },
  },
  tags: ['performance', 'logging', 'benchmark'],
};
