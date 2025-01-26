import type { Mock } from 'bun:test';

export interface ConsoleMock {
  log: Mock<(...args: any[]) => void>;
  warn: Mock<(...args: any[]) => void>;
  error: Mock<(...args: any[]) => void>;
}
