import { createLogger } from '@sueno/logger';

const logger = createLogger({
  silent: true,
});

logger.info('This is a simple log message');

console.log('Previous message should not be logged');
