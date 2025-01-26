import { logger, configure } from '@sueno/logger';
import { PrometheusPlugin } from '@sueno/logger-prometheus';

const prometheusPlugin = new PrometheusPlugin({
  prefix: 'myapp_',
  collectDefaultMetrics: true,
});

// Configure logger with the plugin
configure({
  name: 'MyApp',
  plugins: [prometheusPlugin],
});

// Create Bun server for metrics endpoint
const server = Bun.serve({
  port: 9090,
  async fetch(req) {
    const url = new URL(req.url);

    if (url.pathname === '/metrics') {
      return new Response(await prometheusPlugin.getMetrics(), {
        headers: {
          'Content-Type': prometheusPlugin.getRegistry().contentType,
        },
      });
    }

    return new Response('Not Found', { status: 404 });
  },
});

// Example logging that will be tracked in Prometheus
logger.info('Application started');
logger.warn('System running low on memory', { memoryUsage: process.memoryUsage() });

logger.request('GET', '/api/users', 200, { duration: 150 });
logger.request('POST', '/api/data', 500, { duration: 2500 });

console.log(`Metrics available at http://localhost:${server.port}/metrics`);
