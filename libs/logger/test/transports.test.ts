import { expect, test, describe, beforeEach, afterEach } from 'bun:test';
import { FileTransport, createTransport } from '../src/transports';
import * as fs from 'fs';
import * as path from 'path';

describe('Transports', () => {
  const testDir = path.join(process.cwd(), 'test-logs');
  const testFile = 'test.log';

  beforeEach(() => {
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('FileTransport', () => {
    test('should create log file', () => {
      const transport = new FileTransport({
        type: 'file',
        filename: testFile,
        dirname: testDir,
      });

      transport.log('info', 'Test message');

      const logPath = path.join(testDir, testFile);
      expect(fs.existsSync(logPath)).toBe(true);
    });

    test('should write log entry', () => {
      const transport = new FileTransport({
        type: 'file',
        filename: testFile,
        dirname: testDir,
      });

      const testMessage = 'Test log message';
      transport.log('info', testMessage);

      const logPath = path.join(testDir, testFile);
      const content = fs.readFileSync(logPath, 'utf-8');

      expect(content).toContain(testMessage);
      expect(content).toContain('info');
    });

    test('should rotate files when size limit reached', () => {
      const transport = new FileTransport({
        type: 'file',
        filename: testFile,
        dirname: testDir,
        maxSize: 50,
        maxFiles: 3,
      });

      for (let i = 0; i < 10; i++) {
        transport.log('info', `Test message ${i}`);
      }

      expect(fs.existsSync(path.join(testDir, `${testFile}.1`))).toBe(true);
    });
  });

  describe('createTransport', () => {
    test('should create file transport', () => {
      const transport = createTransport({
        type: 'file',
        filename: testFile,
        dirname: testDir,
      });

      expect(transport).toBeInstanceOf(FileTransport);
    });

    test('should throw error for unsupported transport', () => {
      expect(() => {
        createTransport({
          type: 'invalid' as any,
          filename: testFile,
        });
      }).toThrow();
    });
  });
});
