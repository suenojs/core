import { expect, test, describe, beforeEach, mock } from 'bun:test';
import type { ConsoleMock } from './types';
import { SuenoLogger } from '../src/logger';

describe('SuenoLogger', () => {
  let logger: SuenoLogger;
  let consoleMock: ConsoleMock;

  beforeEach(() => {
    // Mock console methods
    consoleMock = {
      log: mock(() => {}),
      warn: mock(() => {}),
      error: mock(() => {}),
    };

    global.console = {
      ...console,
      ...consoleMock,
    };

    logger = new SuenoLogger({
      name: 'TEST',
      level: 'debug',
      time: false, // Disable time for predictable output
    });
  });

  describe('Log Levels', () => {
    test('should log at debug level', async () => {
      await logger.debug('Debug message');
      expect(consoleMock.log).toHaveBeenCalled();
    });

    test('should log at info level', async () => {
      await logger.info('Info message');
      expect(consoleMock.log).toHaveBeenCalled();
    });

    test('should log at warn level', async () => {
      await logger.warn('Warning message');
      expect(consoleMock.warn).toHaveBeenCalled();
    });

    test('should log at error level', async () => {
      await logger.error('Error message');
      expect(consoleMock.error).toHaveBeenCalled();
    });

    test('should respect log level hierarchy', async () => {
      logger.setLevel('warn');

      await logger.debug('Debug message');
      await logger.info('Info message');
      await logger.warn('Warning message');
      await logger.error('Error message');

      expect(consoleMock.log).not.toHaveBeenCalled(); // debug and info
      expect(consoleMock.warn).toHaveBeenCalled();
      expect(consoleMock.error).toHaveBeenCalled();
    });
  });

  describe('Data Handling', () => {
    test('should log with additional data', async () => {
      const data = { key: 'value' };
      await logger.info('Message with data', data);
      expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('value'));
    });

    test('should handle undefined data', async () => {
      await logger.info('Message without data');
      expect(consoleMock.log).toHaveBeenCalled();
    });
  });

  // describe('Trace ID', () => {
  //   test('should set and use trace ID', async () => {
  //     logger.setTraceId('test-trace');
  //     await logger.info('Message with trace');
  //     const calls = consoleMock.log.mock.calls.map((call) => stripAnsi(call[0].toString()));
  //     expect(calls.some((call) => call.includes('test-trace'))).toBe(true);
  //   });
  // });
});
