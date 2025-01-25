import { createLogger } from '../src';

// Basic logger with different time formats
const loggerIso = createLogger({
  name: 'IsoTime',
  timeFormat: 'iso',
});

const loggerEpoch = createLogger({
  name: 'EpochTime',
  timeFormat: 'epoch',
});

const loggerUnix = createLogger({
  name: 'UnixTime',
  timeFormat: 'unix',
});

const loggerNoTime = createLogger({
  name: 'NoTime',
  time: false,
});

// Demonstrate different time formats
loggerIso.info('Using ISO time format');
loggerEpoch.info('Using Epoch time format');
loggerUnix.info('Using Unix time format');
loggerNoTime.info('No time displayed');
