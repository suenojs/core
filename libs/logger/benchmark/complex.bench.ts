import { bench, run } from 'mitata';
import {
  suenoLogger,
  suenoPerformanceLogger,
  winstonLogger,
  pinoLogger,
  complexData,
} from './utils';

bench('Sueno - Complex log', () => {
  return suenoLogger.info('Complex log entry', complexData);
});

bench('Sueno (Performance) - Complex log', () => {
  return suenoPerformanceLogger.info('Complex log entry', complexData);
});

bench('Winston - Complex log', () => {
  winstonLogger.info('Complex log entry', { ...complexData });
});

bench('Pino - Complex log', () => {
  pinoLogger.info({ msg: 'Complex log entry', ...complexData });
});

run();
