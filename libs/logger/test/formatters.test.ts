import { expect, test, describe } from 'bun:test';
import { formatTime, getLevelColor, formatMessage } from '../src/formatters';
import chalk from 'chalk';

describe('Formatters', () => {
  describe('formatTime', () => {
    test('should format ISO time', () => {
      const time = formatTime('iso', true);
      expect(time).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });

    test('should format epoch time', () => {
      const time = formatTime('epoch', true);
      expect(time).toMatch(/^\d+$/);
    });

    test('should format unix time', () => {
      const time = formatTime('unix', true);
      expect(time).toMatch(/^\d+$/);
    });

    test('should return empty string when time is disabled', () => {
      const time = formatTime('iso', false);
      expect(time).toBe('');
    });
  });

  describe('getLevelColor', () => {
    test('should color error level red', () => {
      const colored = getLevelColor('error');
      expect(colored).toBe(chalk.redBright('error'));
    });

    test('should color warn level yellow', () => {
      const colored = getLevelColor('warn');
      expect(colored).toBe(chalk.yellowBright('warn'));
    });

    test('should color info level green', () => {
      const colored = getLevelColor('info');
      expect(colored).toBe(chalk.green('info'));
    });

    test('should color debug level blue', () => {
      const colored = getLevelColor('debug');
      expect(colored).toBe(chalk.blue('debug'));
    });
  });

  describe('formatMessage', () => {
    test('should format basic message', () => {
      const message = formatMessage('info', 'Test message', 'TEST', '', false);
      expect(message).toContain('INFO');
      expect(message).toContain('Test message');
      expect(message).toContain('TEST');
    });

    test('should format message with data', () => {
      const data = { key: 'value' };
      const message = formatMessage('info', 'Test message', 'TEST', '', false, data);
      expect(message).toContain('key');
      expect(message).toContain('value');
    });

    test('should handle group indentation', () => {
      const message = formatMessage('info', 'Test message', 'TEST', '', false, undefined, {
        indent: 2,
      });
      expect(message).toContain('├─');
    });
  });
});
