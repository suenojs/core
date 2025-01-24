# Request Validation

## Schema Validation

```ts
import { z } from 'zod';
import { validate } from '@sueno/sdk';

const userSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  age: z.number().min(18),
});

sueno.post('/users', validate({ body: userSchema }), async (ctx) => {
  const user = await ctx.body.json();
  // user is fully typed and validated
  return { message: 'User created' };
});
```

## Query Parameters

```ts
const querySchema = z.object({
  page: z.number().default(1),
  limit: z.number().max(100).default(10),
});

sueno.get('/users', validate({ query: querySchema }), (ctx) => {
  const { page, limit } = ctx.query;
  // page and limit are numbers
  return { users: [] };
});
```

## Custom Validators

```ts
const validateAuth = async (ctx, next) => {
  const token = ctx.headers.get('authorization');
  if (!token) {
    throw new Error('Unauthorized');
  }
  await next();
};
```
