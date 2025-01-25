import { logger, configure } from '../src';

// Configure default logger with different time formats
configure({
  name: 'IsoTime',
  timeFormat: 'iso',
});

logger.info('Using ISO time format');

// Reconfigure with epoch time
configure({
  name: 'EpochTime',
  timeFormat: 'epoch',
});

logger.info('Using Epoch time format');

// Reconfigure with unix time
configure({
  name: 'UnixTime',
  timeFormat: 'unix',
});

logger.info('Using Unix time format');

// Disable time display
configure({
  name: 'NoTime',
  time: false,
});

logger.info('No time displayed');
