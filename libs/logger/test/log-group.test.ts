import { expect, test, describe, beforeEach, mock } from 'bun:test';
import type { ConsoleMock } from './types';
import { createLogger } from '../src';

describe('LogGroup', () => {
  let logger: ReturnType<typeof createLogger>;
  let consoleMock: ConsoleMock;

  beforeEach(() => {
    consoleMock = {
      log: mock((message: any, ...args: any[]) => {}),
      warn: mock((message: any, ...args: any[]) => {}),
      error: mock((message: any, ...args: any[]) => {}),
    };

    global.console = {
      ...console,
      ...consoleMock,
    };

    logger = createLogger({
      name: 'TEST',
      time: false,
    });
  });

  test('should create group with name', () => {
    const group = logger.group('TestGroup');
    expect(consoleMock.log).toHaveBeenCalledWith(expect.stringContaining('TestGroup'));
  });

  test('should log messages within group', async () => {
    const group = logger.group('TestGroup');
    await group.info('Test message');

    const mockCalls = consoleMock.log.mock.calls;
    console.error('All mock calls:', mockCalls);

    const allMessages = mockCalls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');

    console.error('Combined messages:', allMessages);
    expect(allMessages).toContain('Test message');
  });

  test('should handle nested groups', async () => {
    const parentGroup = logger.group('Parent');
    const childGroup = parentGroup.group('Child');

    await childGroup.info('Nested message');

    const mockCalls = consoleMock.log.mock.calls;
    const allMessages = mockCalls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');

    expect(allMessages).toContain('Child');
    expect(allMessages).toContain('Nested message');
  });

  test('should handle group end', async () => {
    const group = logger.group('TestGroup');
    await group.info('Message before end');
    group.end();

    const mockCalls = consoleMock.log.mock.calls;
    const allMessages = mockCalls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');

    expect(allMessages).toContain('Message before end');
  });

  test('should log at different levels within group', async () => {
    const group = logger.group('TestGroup');

    await group.debug('Debug message');
    await group.info('Info message');
    await group.warn('Warning message');
    await group.error('Error message');

    const logMessages = consoleMock.log.mock.calls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');
    const warnMessages = consoleMock.warn.mock.calls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');
    const errorMessages = consoleMock.error.mock.calls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');

    expect(logMessages).toContain('Debug message');
    expect(logMessages).toContain('Info message');
    expect(warnMessages).toContain('Warning message');
    expect(errorMessages).toContain('Error message');
  });

  test('should maintain proper indentation in nested groups', async () => {
    const rootGroup = logger.group('Root');
    const level1Group = rootGroup.group('Level 1');
    const level2Group = level1Group.group('Level 2');

    await level2Group.info('Deeply nested message');

    const allMessages = consoleMock.log.mock.calls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');

    expect(allMessages).toContain('Level 2');
    expect(allMessages).toContain('Deeply nested message');
  });

  test('should handle multiple messages in same group', async () => {
    const group = logger.group('TestGroup');

    await group.info('First message');
    await group.info('Second message');
    await group.info('Third message');

    const allMessages = consoleMock.log.mock.calls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');

    expect(allMessages).toContain('First message');
    expect(allMessages).toContain('Second message');
    expect(allMessages).toContain('Third message');
  });

  test('should handle data objects in group messages', async () => {
    const group = logger.group('TestGroup');
    const testData = { key: 'value', nested: { prop: 123 } };

    await group.info('Message with data', testData);

    const allMessages = consoleMock.log.mock.calls
      .map((args) => args.map((arg) => String(arg)).join(' '))
      .join('\n');

    expect(allMessages).toContain('value');
    expect(allMessages).toContain('123');
  });
});
