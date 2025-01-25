import { logger, configure } from '../src';

// Configure logger with file transport
configure({
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
logger.info('Application started');
logger.debug('Debug message');
logger.warn('Warning message', { code: 'WARN001' });
logger.error('Error occurred', {
  error: new Error('Connection failed'),
  code: 'ERR001',
});

// HTTP request logging examples
logger.request('GET', '/api/users', 200, { userId: 123 });
logger.request('POST', '/api/data', 400, { error: 'Invalid input' });

// System status logging examples
logger.system(200, 'System healthy', { uptime: '24h' });
logger.system(500, 'System error', { error: 'Out of memory' });
