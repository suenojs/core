# Middleware

Middleware functions can modify the request/response cycle.

## Global Middleware

```ts
const sueno = new Sueno();

// Add global middleware
sueno.use(async (ctx, next) => {
  console.log('Request started');
  const start = Date.now();

  await next();

  const ms = Date.now() - start;
  console.log(`Request completed in ${ms}ms`);
});
```

## Route-Specific Middleware

```ts
// Single middleware
sueno.get(
  '/admin',
  auth(), // middleware
  (ctx) => {
    return 'Admin Panel';
  }
);

// Multiple middleware
sueno.post('/users', validate(userSchema), rateLimiter(), async (ctx) => {
  const user = await ctx.body.json();
  return { message: 'Created' };
});
```

## Built-in Middleware

- `cors()` - CORS support
- `compress()` - Response compression
- `bodyParser()` - Parse request bodies
- `static()` - Serve static files
