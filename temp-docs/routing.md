# Routing & HTTP Methods

## Basic Routes

```ts
const sueno = new Sueno();

// Basic GET route
sueno.get('/hello', (ctx) => {
  return 'Hello World!';
});

// Route with URL parameters
sueno.get('/users/:id', (ctx) => {
  const { id } = ctx.params;
  return `User ${id}`;
});

// Async route handler
sueno.post('/users', async (ctx) => {
  const body = await ctx.body.json();
  return { message: 'Created', data: body };
});
```

## Available HTTP Methods

- `get(path, handler)`
- `post(path, handler)`
- `put(path, handler)`
- `patch(path, handler)`
- `delete(path, handler)`
- `options(path, handler)`
- `head(path, handler)`
- `all(path, handler)` - Matches all HTTP methods

## Route Parameters

```ts
// Named parameters
sueno.get('/users/:id', (ctx) => {
  const { id } = ctx.params;
});

// Optional parameters
sueno.get('/posts/:id?', (ctx) => {
  const { id } = ctx.params; // id might be undefined
});

// Wildcard
sueno.get('/files/*', (ctx) => {
  const path = ctx.params['*'];
});
```
