import { logger, configure } from '../src';

// Helper objects for example
const analytics = {
  async track(data: any) {
    console.log('Analytics hook:', data);
  },
};

const errorService = {
  async notify(error: Error) {
    console.log('Error service hook:', error.message);
  },
};

const metrics = {
  async trackRequest(data: any) {
    console.log('Request metrics hook:', data);
  },
};

const monitoring = {
  async report(status: number, message: string) {
    console.log('System monitoring hook:', { status, message });
  },
};

// Configure logger with all types of hooks
configure({
  name: 'HooksLogger',
  hooks: {
    onLog: async (level, message, data) => {
      // Track all log messages
      await analytics.track({ level, message, data });
    },
    onError: async (error) => {
      // Handle errors specially
      await errorService.notify(error);
    },
    onRequest: async (method, path, status, data) => {
      // Track API requests
      await metrics.trackRequest({ method, path, status, data });
    },
    onSystem: async (status, message, data) => {
      // Monitor system status
      await monitoring.report(status, message);
    },
  },
});

// Demonstrate different hook triggers
logger.info('Regular log message', { user: 'test' });

logger.error('Error occurred', new Error('Test error'));

logger.request('GET', '/api/users', 200, { userId: 123 });
logger.request('POST', '/api/data', 400, { error: 'Invalid input' });

logger.system(200, 'System healthy', { uptime: '24h' });
logger.system(500, 'System error', { error: 'Out of memory' });
