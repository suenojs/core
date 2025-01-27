import { bench, run } from 'mitata';
import { suenoLogger, suenoPerformanceLogger, winstonLogger, pinoLogger } from './utils';

bench('Sueno - Error log', () => {
  return suenoLogger.error('Error occurred', new Error('Test error'));
});

bench('Sueno (Performance) - Error log', () => {
  return suenoPerformanceLogger.error('Error occurred', new Error('Test error'));
});

bench('Winston - Error log', () => {
  winstonLogger.error('Error occurred', { error: new Error('Test error') });
});

bench('Pino - Error log', () => {
  pinoLogger.error({ err: new Error('Test error') }, 'Error occurred');
});

run();
