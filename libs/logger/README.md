# @sueno/logger

A flexible and type-safe logging library that supports both console and Pino-based logging with beautiful formatting.

## Features

- Simple import and use with default logger
- Hooks for custom logging behavior
- Type-safe logger names with generics
- Beautiful console output with colors
- Optional Pino integration for production logging
- Request/Response logging support
- Trace ID support for request tracking
- Configurable log levels
- Detailed logging with structured data

## Installation

```bash
npm install @sueno/logger
```

## Usage

### Simple Usage

```typescript
// Simple usage
import { logger } from '@sueno/logger';
logger.info('Hello!');

// Advanced usage
import { configure } from '@sueno/logger';
configure({
  level: 'debug',
  transport: customTransport,
  hooks: {
    onError: async (error) => {
      await notify(error);
    },
  },
  // ... many more options for power users
});
```

### Custom Logger Instance

```typescript
import { createLogger } from '@sueno/logger';

const customLogger = createLogger({
  name: 'my-service',
  level: 'debug',
  hooks: {
    onLog: async (level, message, data) => {
      await customLogHandler(level, message, data);
    },
  },
});
```

### Configuration Options

```typescript
import { createLogger } from '@sueno/logger';

const logger = createLogger({
  name: 'my-service',
  level: 'debug',
  traceId: 'request-123',
  useConsole: true, // Use console.log (default: true)
  // ... other Pino options when useConsole is false
});
```

### HTTP Request Logging

```typescript
const logger = createLogger<'http'>({ name: 'http' });

logger.request('GET', '/api/users', 200, {
  duration: 50,
  details: { userId: 123 },
});
```

### System Status Logging

```typescript
logger.system(200, 'Server started successfully');
logger.system(500, 'Database connection failed');
```

### Changing Log Level or Trace ID

```typescript
logger.setLevel('debug');
logger.setTraceId('new-trace-id');
```

## Plugins ideas

- Prometheus
- Http, send logs to a http endpoint
- Slack or telegram, send logs to a slack or telegram channel
- Sentry, send logs to a sentry instance
- Datadog, send logs to a datadog instance
- AWS CloudWatch, send logs to a AWS CloudWatch instance
- Azure App Insights, send logs to a Azure App Insights instance
- Elasticsearch, send logs to a Elasticsearch instance

## Log Levels

- `debug`: Detailed information for debugging
- `info`: General information about application operation
- `warn`: Warning messages for potentially harmful situations
- `error`: Error messages for serious problems

## Output Format

```
[2024-01-24T22:57:59.756Z] {TRACE_ID} [LEVEL] {MODULE} - Message/Details
```

## License

Apache 2.0

## Performance Considerations

For maximum performance in production environments, you can enable performance mode:

```typescript
const logger = createLogger({
  performanceMode: true, // Disables pretty formatting for maximum performance
  time: false, // Disable time for even better performance
  hooks: undefined, // Disable hooks if not needed
});
```

Performance comparison (operations/second):

- Pretty mode: Beautiful colored output, great for development
- Performance mode: High-speed logging optimized for production

Performance tips:

1. Use `performanceMode: true` in production
2. Disable time if not needed
3. Only enable hooks when required
4. Consider using transport in batches for high-volume logging
