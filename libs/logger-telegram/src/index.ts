import type { LoggerPlugin, LogLevel } from '@sueno/logger';

interface TelegramPluginOptions {
  /**
   * Telegram Bot Token obtained from BotFather
   */
  token: string;
  /**
   * Chat ID where messages will be sent
   * Can be obtained by sending a message to the bot and checking
   * https://api.telegram.org/bot<YourBOTToken>/getUpdates
   */
  chatId: string;
  /**
   * Optional prefix for messages
   */
  prefix?: string;
  /**
   * Which log levels should be sent to Telegram
   * @default ['error']
   */
  levels?: LogLevel[];
  /**
   * Whether to parse message as HTML
   * @default true
   */
  parseMode?: 'HTML' | 'MarkdownV2' | 'Markdown';
  /**
   * Batch messages and send them in groups
   * @default false
   */
  batchMessages?: boolean;
  /**
   * Batch size when batchMessages is true
   * @default 10
   */
  batchSize?: number;
  /**
   * Batch timeout in milliseconds
   * @default 5000
   */
  batchTimeout?: number;
}

export class TelegramPlugin implements LoggerPlugin {
  name = 'telegram';
  version = '0.1.0';

  private token: string;
  private chatId: string;
  private prefix: string;
  private levels: LogLevel[];
  private parseMode: 'HTML' | 'MarkdownV2' | 'Markdown';
  private batchMessages: boolean;
  private batchSize: number;
  private batchTimeout: number;
  private messageQueue: string[] = [];
  private batchTimeoutId?: number;

  constructor(options: TelegramPluginOptions) {
    this.token = options.token;
    this.chatId = options.chatId;
    this.prefix = options.prefix || '';
    this.levels = options.levels || ['error'];
    this.parseMode = options.parseMode || 'HTML';
    this.batchMessages = options.batchMessages || false;
    this.batchSize = options.batchSize || 10;
    this.batchTimeout = options.batchTimeout || 5000;
  }

  private async sendMessage(text: string): Promise<void> {
    try {
      const url = `https://api.telegram.org/bot${this.token}/sendMessage`;
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chat_id: this.chatId,
          text,
          parse_mode: this.parseMode,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error('Failed to send message to Telegram:', error);
      }
    } catch (error) {
      console.error('Error sending message to Telegram:', error);
    }
  }

  private formatMessage(level: LogLevel, message: string, data?: Record<string, any>): string {
    const timestamp = new Date().toISOString();
    let formattedMessage = `${this.prefix}${timestamp} [${level.toUpperCase()}] ${message}`;

    if (data) {
      if (data instanceof Error) {
        formattedMessage += `\n<pre>Stack: ${data.stack}</pre>`;
      } else {
        formattedMessage += `\n<pre>${JSON.stringify(data, null, 2)}</pre>`;
      }
    }

    return formattedMessage;
  }

  private async sendBatch(): Promise<void> {
    if (this.messageQueue.length === 0) return;

    const messages = this.messageQueue.join('\n\n');
    this.messageQueue = [];
    await this.sendMessage(messages);
  }

  private queueMessage(message: string): void {
    this.messageQueue.push(message);

    if (this.messageQueue.length >= this.batchSize) {
      this.sendBatch();
    } else if (!this.batchTimeoutId) {
      this.batchTimeoutId = setTimeout(() => {
        this.batchTimeoutId = undefined;
        this.sendBatch();
      }, this.batchTimeout) as unknown as number;
    }
  }

  hooks = {
    onLog: async (level: LogLevel, message: string, data?: Record<string, any>) => {
      if (!this.levels.includes(level)) return;

      const formattedMessage = this.formatMessage(level, message, data);

      if (this.batchMessages) {
        this.queueMessage(formattedMessage);
      } else {
        await this.sendMessage(formattedMessage);
      }
    },

    onError: async (error: Error, data?: Record<string, any>) => {
      if (!this.levels.includes('error')) return;

      const formattedMessage = this.formatMessage(
        'error',
        error.message,
        data || { stack: error.stack },
      );

      if (this.batchMessages) {
        this.queueMessage(formattedMessage);
      } else {
        await this.sendMessage(formattedMessage);
      }
    },
  };
}
