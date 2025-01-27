import { bench, run } from 'mitata';
import {
  suenoLogger,
  suenoPerformanceLogger,
  winstonLogger,
  pinoLogger,
  simpleMessage,
} from './utils';

bench('Sueno - Simple log', () => {
  return suenoLogger.info(simpleMessage + 'Sueno');
});

bench('Sueno (Performance) - Simple log', () => {
  return suenoPerformanceLogger.info(simpleMessage + 'Sueno Performance');
});

bench('Winston - Simple log', () => {
  winstonLogger.info(simpleMessage + 'Winston');
});

bench('Pino - Simple log', () => {
  pinoLogger.info(simpleMessage + 'Pino');
});

run();
