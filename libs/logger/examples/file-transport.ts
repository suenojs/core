import { createLogger } from '../src';

// Create a logger with file transport
const fileLogger = createLogger({
  name: 'FileLogger',
  transport: {
    type: 'file',
    filename: 'app.log',
    dirname: './logs',
    maxSize: 1024 * 1024, // 1MB
    maxFiles: 3,
  },
});

// Basic logging examples
fileLogger.info('Application started');
fileLogger.debug('Debug message');
fileLogger.warn('Warning message', { code: 'WARN001' });
fileLogger.error('Error occurred', {
  error: 'Connection failed',
  code: 'ERR001',
});

// HTTP request logging examples
fileLogger.request('GET', '/api/users', 200, { userId: 123 });
fileLogger.request('POST', '/api/data', 400, { error: 'Invalid input' });

// System status logging examples
fileLogger.system(200, 'System healthy', { uptime: '24h' });
fileLogger.system(500, 'System error', { error: 'Out of memory' });
