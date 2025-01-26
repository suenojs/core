# @sueno/logger-telegram

A Telegram plugin for @sueno/logger that sends log messages to a Telegram chat.

## Features

- Send log messages to Telegram chat
- Filter by log levels
- Message batching support
- HTML/Markdown formatting
- Error stack trace formatting
- Customizable message prefix

## Installation

```bash
npm install @sueno/logger-telegram
```

## Setup

1. Create a Telegram bot using [BotFather](https://t.me/botfather)
2. Get your bot token
3. Add the bot to your group/channel
4. Get the chat ID by sending a message to the bot and checking:
   ```
   https://api.telegram.org/bot<YourBOTToken>/getUpdates
   ```

## Usage

```typescript
import { logger, configure } from '@sueno/logger';
import { TelegramPlugin } from '@sueno/logger-telegram';

const telegramPlugin = new TelegramPlugin({
  token: 'YOUR_BOT_TOKEN',
  chatId: 'YOUR_CHAT_ID',
  prefix: '🤖 MyApp: ',
  levels: ['error', 'warn'],
  batchMessages: true,
});

configure({
  name: 'MyApp',
  plugins: [telegramPlugin],
});

// Now your errors and warnings will be sent to Telegram
logger.error('Something went wrong', new Error('Database connection failed'));
```

## Configuration Options

| Option        | Type                             | Default   | Description              |
| ------------- | -------------------------------- | --------- | ------------------------ |
| token         | string                           | required  | Telegram Bot Token       |
| chatId        | string                           | required  | Target Chat ID           |
| prefix        | string                           | ''        | Message prefix           |
| levels        | LogLevel[]                       | ['error'] | Which log levels to send |
| parseMode     | 'HTML'\|'MarkdownV2'\|'Markdown' | 'HTML'    | Message format           |
| batchMessages | boolean                          | false     | Enable message batching  |
| batchSize     | number                           | 10        | Max messages per batch   |
| batchTimeout  | number                           | 5000      | Batch timeout in ms      |

## License

Apache 2.0
