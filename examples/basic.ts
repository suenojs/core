import { Sueno } from '../src';
import { csrf } from '../src';
import { createRouter } from '../src';
import { HttpStatus } from '../src/types/http';
import type { BaseContext } from '../src/types/context';
import type { NextFunction } from '../src/types/middleware';

// Example usage
const app = new Sueno({
  logger: true,
  trustProxy: true,
});

// Add CSRF protection middleware globally
app.use(
  csrf({
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
    },
  })
);

app.use((ctx: BaseContext, next: NextFunction) => {
  ctx.logger.info('Global middleware');
  ctx.state.testData = 'test';
  return next();
});

// Update example route handlers with explicit types
app.get('/hello', (ctx) => {
  ctx.logger.info(`State: ${ctx.state.testData}`);
  ctx.status = HttpStatus.MOVED_PERMANENTLY;
  return 'Hello World!';
});

app.get('/hello/json', (ctx) => {
  return { message: 'Hello World!' };
});

app.get('/hello/:id', (ctx) => {
  ctx.logger.debug('Starting to process request...');
  ctx.logger.info(`Processing request for ID: ${ctx.params.id}`);

  if (ctx.params.id === 'error') {
    ctx.logger.error('Invalid ID provided');
    throw new Error('Invalid ID');
  }

  ctx.logger.debug('Request processed successfully');
  return `Hello ${ctx.params.id}!`;
});

app.get('/users/:userId/posts/:postId', (ctx) => {
  ctx.logger.info(`Looking up post for user`);
  ctx.logger.debug(`User ID: ${ctx.params.userId}, Post ID: ${ctx.params.postId}`);
  return `User ${ctx.params.userId}, Post ${ctx.params.postId}`;
});

const someRouter = createRouter('/some/router');
someRouter.use((ctx, next) => {
  ctx.logger.info('Some Router Middleware');
  return next();
});

someRouter.get('/hello', async (ctx) => {
  return 'Hello from Some Router!';
});

someRouter.get('/sleep', async (ctx) => {
  const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
  await sleep(1000);
  return { message: 'Hello from Some Router!' };
});

app.route(someRouter);

// Start the server
app.serve(
  {
    port: 3000,
    development: true,
  },
  (options) => {
    console.log(`Server started on http://${options.hostname}:${options.port}`);
  }
);

// Example API client usage
// const api = createSuenoApi(
//   {
//     baseUrl: 'http://localhost:3000',
//   },
//   app
// );

// api.get('/hello/json').then((res) => {
//   console.log(res);
// });
