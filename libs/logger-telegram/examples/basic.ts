import { logger, configure } from '@sueno/logger';
import { TelegramPlugin } from '../src';

// Create Telegram plugin instance
const telegramPlugin = new TelegramPlugin({
  token: 'YOUR_BOT_TOKEN',
  chatId: 'YOUR_CHAT_ID',
  prefix: '🤖 MyApp: ',
  levels: ['error', 'warn'],
  batchMessages: true,
  batchSize: 5,
  batchTimeout: 10000,
});

// Configure logger with the plugin
configure({
  name: 'MyApp',
  plugins: [telegramPlugin],
});

// Example usage
logger.info('Application started'); // Won't be sent to Telegram
logger.warn('Low memory warning', { memoryUsage: process.memoryUsage() }); // Will be sent
logger.error('Database connection failed', new Error('Connection timeout')); // Will be sent

// Example with multiple errors that will be batched
for (let i = 0; i < 10; i++) {
  logger.error(`Test error ${i}`, { errorCode: i });
}
