import { logger, configure } from '../src';

// Configure logger for group examples
configure({
  name: 'GroupLogger',
});

// Basic group example
const group = logger.group('Group 1');
group.info('This is a message in a group');
group.info('Group 1 json', { key: 'value' });

// Nested group example
const group2 = group.group('Group 2');
group2.info('This is a message in a nested group');
group2.info('Group 2 json', { key: 'value' });
group2.info('Group 2 json', { key: 'value' });
group2.info('Group 2 end');
group2.end();

group.info('Group 1 end');
group.end();

// Example with system initialization groups
const initGroup = logger.group('System Initialization');
initGroup.info('Starting up...');
initGroup.info('Loading configuration');

const servicesGroup = initGroup.group('Services');
servicesGroup.info('NetworkService initialized');
servicesGroup.info('DatabaseConnection established', {
  host: 'localhost',
  port: 5432,
  database: 'myapp',
});
servicesGroup.end();

initGroup.info('System ready');
initGroup.end();
