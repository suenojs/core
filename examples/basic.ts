import { Sueno } from '../src';

// Create main app with base URL
const app = new Sueno({
  logger: true,
  trustProxy: true,
  baseUrl: '/api',
  logLevel: 'debug',
});

// Create a users router
const usersRouter = new Sueno({
  baseUrl: '/users',
  logLevel: 'debug',
});

// Add routes to users router
usersRouter.get('/', (ctx) => {
  ctx.logger.info('Accessing users list');
  return { users: ['user1', 'user2'] };
});

usersRouter.get('/:id', (ctx) => {
  ctx.logger.info(`Accessing user ${ctx.params.id}`);
  return { userId: ctx.params.id };
});

// Create a health router
const healthRouter = new Sueno({
  baseUrl: '/health',
  logLevel: 'debug',
});

// Add routes to health router
healthRouter.get('/', (ctx) => {
  ctx.logger.info('Health check requested');
  return { status: 'ok', time: new Date().toISOString() };
});

// Add middleware to main app
app.use((ctx, next) => {
  ctx.logger.info(`Incoming request to ${ctx.path}`);
  ctx.state.testData = 'test';
  return next();
});

// Add basic routes to main app
app.get('/hello', (ctx) => {
  // ctx. - should see available fields for ctx
  ctx.logger.info(`State: ${ctx.state.testData}`);
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

// app.get('/users/:userId/posts/:postId', (ctx) => {
//   ctx.logger.info(`Looking up post for user`);
//   ctx.logger.debug(`User ID: ${ctx.params.userId}, Post ID: ${ctx.params.postId}`);
//   return `User ${ctx.params.userId}, Post ${ctx.params.postId}`;
// });

const nestedRouter = new Sueno({
  baseUrl: '/nested/:id',
  logLevel: 'debug',
});

nestedRouter.get('/hello', (ctx) => {
  return `Nested route for ID: ${ctx.params.id}`;
});

const deepNestedRouter = new Sueno({
  baseUrl: '/deep/nested/:nid',
  logLevel: 'debug',
});

deepNestedRouter.get('/hello', (ctx) => {
  return `Deep nested route for ID: ${ctx.params.nid} + ${ctx.params.id}`;
});

nestedRouter.route(deepNestedRouter);

// Mount routers
app.route(usersRouter);
app.route(healthRouter);
app.route(nestedRouter);
app.route(deepNestedRouter);

// Start the server
app.serve({ port: 3000 }, (options) => {
  console.log(`Started ${options.hostname}:${options.port}`);
});
