import { createLogger } from '../src';

// Create a logger with redaction settings
const secureLogger = createLogger({
  name: 'SecureLogger',
  redact: {
    paths: ['password', 'creditCard', 'ssn', '*.secret', 'user.email'],
    censor: '[REDACTED]',
  },
});

// Example 1: Basic redaction of sensitive fields
secureLogger.info('User login attempt', {
  username: 'john.doe',
  password: 'supersecret123', // Will be redacted
  metadata: {
    secret: 'sensitive-data', // Will be redacted due to *.secret pattern
    public: 'public-data', // Will remain visible
  },
});

// Example 2: Nested object redaction
secureLogger.info('Payment processed', {
  user: {
    name: 'John Doe',
    email: 'john@example.com', // Will be redacted due to user.email pattern
  },
  creditCard: '4111-1111-1111-1111', // Will be redacted
  amount: 99.99, // Will remain visible
});

// Example 3: Array with sensitive data
secureLogger.info('Batch user processing', {
  users: [
    {
      name: 'Alice',
      ssn: '123-45-6789', // Will be redacted
      role: 'admin',
    },
    {
      name: 'Bob',
      ssn: '987-65-4321', // Will be redacted
      role: 'user',
    },
  ],
  metadata: {
    secret: 'batch-key', // Will be redacted due to *.secret pattern
    processId: '12345', // Will remain visible
  },
});
