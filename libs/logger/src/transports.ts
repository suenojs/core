import { LogLevel, LogOptions } from './index';
import * as fs from 'fs';
import * as path from 'path';

const isBun = typeof process !== 'undefined' && process.versions && process.versions.bun;

export interface Transport {
  log(level: LogLevel, message: string, data?: Record<string, any>, options?: LogOptions): void;
}

export type TransportType = 'file';
export interface FileTransportConfig {
  type: 'file';
  filename: string;
  dirname?: string;
  maxSize?: number;
  maxFiles?: number;
}

export type TransportConfig = FileTransportConfig;

export class FileTransport implements Transport {
  private filename: string;
  private dirname: string;
  private maxSize: number;
  private maxFiles: number;
  private currentSize: number = 0;

  constructor(config: FileTransportConfig) {
    this.filename = config.filename;
    this.dirname = config.dirname || process.cwd();
    this.maxSize = config.maxSize || 10 * 1024 * 1024; // Default 10MB
    this.maxFiles = config.maxFiles || 5;

    // Create directory if it doesn't exist
    if (isBun) {
      try {
        if (!fs.existsSync(this.dirname)) {
          fs.mkdirSync(this.dirname, { recursive: true });
        }
      } catch (error) {
        // Directory might already exist
      }
    } else {
      if (!fs.existsSync(this.dirname)) {
        fs.mkdirSync(this.dirname, { recursive: true });
      }
    }

    // Initialize current size
    const filePath = this.getFilePath();
    if (isBun) {
      try {
        const file = Bun.file(filePath);
        this.currentSize = file.size;
      } catch {
        this.currentSize = 0;
      }
    } else {
      if (fs.existsSync(filePath)) {
        this.currentSize = fs.statSync(filePath).size;
      }
    }
  }

  private getFilePath(): string {
    return path.join(this.dirname, this.filename);
  }

  private async deleteFile(filePath: string): Promise<void> {
    if (isBun) {
      try {
        await Bun.write(filePath, new TextEncoder().encode('')); // Clear file
        await fs.promises.unlink(filePath);
      } catch {
        // File might not exist
      }
    } else {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
  }

  private rotate(): void {
    const filePath = this.getFilePath();

    // Remove oldest file if it exists
    const oldestFile = path.join(this.dirname, `${this.filename}.${this.maxFiles}`);
    this.deleteFile(oldestFile);

    // Rotate existing files
    for (let i = this.maxFiles - 1; i >= 1; i--) {
      const oldFile = path.join(this.dirname, `${this.filename}.${i}`);
      const newFile = path.join(this.dirname, `${this.filename}.${i + 1}`);
      if (isBun) {
        try {
          const oldFileContent = Bun.file(oldFile);
          if (oldFileContent.size > 0) {
            const content = fs.readFileSync(oldFile);
            Bun.write(newFile, content);
          }
        } catch {
          // File might not exist
        }
      } else {
        if (fs.existsSync(oldFile)) {
          fs.renameSync(oldFile, newFile);
        }
      }
    }

    // Rename current file
    if (isBun) {
      try {
        const currentFile = Bun.file(filePath);
        if (currentFile.size > 0) {
          const content = fs.readFileSync(filePath);
          Bun.write(path.join(this.dirname, `${this.filename}.1`), content);
          Bun.write(filePath, new TextEncoder().encode('')); // Clear current file
        }
      } catch {
        // File might not exist
      }
    } else {
      if (fs.existsSync(filePath)) {
        fs.renameSync(filePath, path.join(this.dirname, `${this.filename}.1`));
      }
    }

    this.currentSize = 0;
  }

  log(level: LogLevel, message: string, data?: Record<string, any>, options?: LogOptions): void {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      ...options,
    };

    const logString = JSON.stringify(logEntry) + '\n';
    const logSize = Buffer.byteLength(logString);

    // Rotate if adding this log would exceed max size
    if (this.currentSize + logSize > this.maxSize) {
      this.rotate();
    }

    // Append to file
    const filePath = this.getFilePath();
    try {
      if (isBun) {
        // Use sync operations for reliability
        if (!fs.existsSync(filePath)) {
          fs.writeFileSync(filePath, '');
        }
        fs.appendFileSync(filePath, logString);
      } else {
        fs.appendFileSync(filePath, logString);
      }
      this.currentSize += logSize;
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }
}

export function createTransport(config: TransportConfig): Transport {
  switch (config.type) {
    case 'file':
      return new FileTransport(config);
    default:
      throw new Error(`Unsupported transport type: ${(config as any).type}`);
  }
}
