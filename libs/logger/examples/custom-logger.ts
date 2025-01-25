import { createLogger } from '../src';

// Create a custom logger with specific name and options
const apiLogger = createLogger<'API'>({
  name: 'API',
  level: 'debug',
  timeFormat: 'iso',
});

// Create another logger for database operations
const dbLogger = createLogger<'DB'>({
  name: 'DB',
  level: 'info',
  time: true,
  timeFormat: 'unix',
});

// Create a logger for security events
const securityLogger = createLogger({
  name: 'SECURITY',
  redact: {
    paths: ['password', 'token', '*.secret'],
    censor: '***',
  },
});

// Example usage of custom loggers
apiLogger.info('API Server starting...');
apiLogger.debug('Initializing routes', { routes: ['/api/v1', '/api/v2'] });
apiLogger.request('POST', '/api/users', 201, { userId: 'new-user-123' });

dbLogger.info('Database connected', { host: 'localhost', port: 5432 });
dbLogger.warn('Slow query detected', { duration: 1500, query: 'SELECT * FROM users' });

securityLogger.info('User authentication', {
  username: 'john',
  password: 'secret123', // Will be redacted
  token: 'jwt-token-123', // Will be redacted
  metadata: {
    secret: 'key-123', // Will be redacted
    ip: '127.0.0.1', // Will remain visible
  },
});

// Example of multiple loggers working together
async function processUserRequest() {
  apiLogger.debug('Received user request');

  dbLogger.info('Fetching user data');
  dbLogger.debug('Executing query', { userId: 123 });

  securityLogger.info('Validating user session', {
    token: 'abc-123', // Will be redacted
    sessionId: 'sess-456', // Will remain visible
  });

  apiLogger.info('Request completed', { status: 'success' });
}

// Run the example
processUserRequest();
