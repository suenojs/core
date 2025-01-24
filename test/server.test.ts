import { expect, test, describe, beforeEach, beforeAll, afterAll } from 'bun:test';
import { Sueno } from '../src/server';
import { createRouter } from '../src/router';
import { HttpStatus } from '../src/types/http';
import type { RouteContext } from '../src/types/context';
import type { MiddlewareHandler } from '../src/types/middleware';
import type { Server } from 'bun';

describe('Sueno Server', () => {
  let app: Sueno;
  let server: Server;

  beforeEach(async () => {
    app = new Sueno({ logger: false });
  });

  beforeAll(() => {
    // Use a different port for tests
    process.env.PORT = '3001';
  });

  afterAll(() => {
    if (server) {
      server.stop();
    }
  });

  const setupServer = async () => {
    server = await app.serve({ port: 3001 });
    return server;
  };

  describe('Route Handling', () => {
    test('handles basic GET route', async () => {
      app.get('/test', () => 'Hello World');
      await setupServer();

      const req = new Request('http://localhost:3001/test');
      const res = await server.fetch(req);

      expect(res.status).toBe(200);
      expect(await res.text()).toBe('Hello World');
    });

    test('handles route parameters', async () => {
      app.get('/users/:id', (ctx: RouteContext) => ({ id: ctx.params.id }));
      await setupServer();

      const req = new Request('http://localhost:3001/users/123');
      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ id: '123' });
    });

    test('handles multiple route parameters', async () => {
      app.get('/users/:userId/posts/:postId', (ctx: RouteContext) => ({
        userId: ctx.params.userId,
        postId: ctx.params.postId,
      }));
      await setupServer();

      const req = new Request('http://localhost:3001/users/123/posts/456');
      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ userId: '123', postId: '456' });
    });

    test('returns 404 for non-existent routes', async () => {
      await setupServer();
      const req = new Request('http://localhost:3001/nonexistent');
      const res = await server.fetch(req);

      expect(res.status).toBe(404);
      expect(await res.text()).toBe('Not Found');
    });
  });

  describe('HTTP Methods', () => {
    test('handles POST requests', async () => {
      app.post('/test', async (ctx: RouteContext) => {
        const body = await ctx.request.json();
        return body;
      });
      await setupServer();

      const req = new Request('http://localhost:3001/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hello: 'world' }),
      });

      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ hello: 'world' });
    });

    test('handles PUT requests', async () => {
      app.put('/test', async (ctx: RouteContext) => {
        const body = await ctx.request.json();
        return body;
      });
      await setupServer();

      const req = new Request('http://localhost:3001/test', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hello: 'world' }),
      });

      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ hello: 'world' });
    });

    test('handles DELETE requests', async () => {
      app.delete('/test', () => ({ deleted: true }));
      await setupServer();

      const req = new Request('http://localhost:3001/test', {
        method: 'DELETE',
      });

      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ deleted: true });
    });
  });

  describe('Middleware', () => {
    test('executes global middleware', async () => {
      const middleware: MiddlewareHandler = async (ctx, next) => {
        ctx.state.test = 'middleware';
        await next();
      };

      app.use(middleware);
      app.get('/test', (ctx: RouteContext) => ({ state: ctx.state.test }));
      await setupServer();

      const req = new Request('http://localhost:3001/test');
      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ state: 'middleware' });
    });

    test('executes route-specific middleware', async () => {
      const middleware: MiddlewareHandler = async (ctx, next) => {
        ctx.state.test = 'route-middleware';
        await next();
      };

      app.get('/test', (ctx: RouteContext) => ({ state: ctx.state.test }));
      await setupServer();

      const req = new Request('http://localhost:3001/test');
      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ state: 'route-middleware' });
    });

    test('executes middleware in correct order', async () => {
      const order: string[] = [];

      const globalMiddleware: MiddlewareHandler = async (ctx, next) => {
        order.push('global');
        await next();
      };

      const routeMiddleware: MiddlewareHandler = async (ctx, next) => {
        order.push('route');
        await next();
      };

      app.use(globalMiddleware);
      app.get('/test', (ctx: RouteContext) => {
        order.push('handler');
        return { order };
      });
      await setupServer();

      const req = new Request('http://localhost:3001/test');
      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.order).toEqual(['global', 'route', 'handler']);
    });
  });

  describe('Router', () => {
    test('mounts router correctly', async () => {
      const router = createRouter('/api');
      router.get('/test', () => ({ message: 'router test' }));

      app.route(router);
      await setupServer();

      const req = new Request('http://localhost:3001/api/test');
      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ message: 'router test' });
    });

    test('handles nested routers', async () => {
      const apiRouter = createRouter('/api');
      const userRouter = createRouter('/users');

      userRouter.get('/:id', (ctx: RouteContext) => ({ id: ctx.params.id }));
      apiRouter.route(userRouter);
      app.route(apiRouter);
      await setupServer();

      const req = new Request('http://localhost:3001/api/users/123');
      const res = await server.fetch(req);
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data).toEqual({ id: '123' });
    });
  });

  describe('Error Handling', () => {
    test('handles thrown errors', async () => {
      app.get('/error', () => {
        throw new Error('Test error');
      });
      await setupServer();

      const req = new Request('http://localhost:3001/error');
      const res = await server.fetch(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal Server Error');
    });

    test('handles async errors', async () => {
      app.get('/async-error', async () => {
        throw new Error('Async error');
      });
      await setupServer();

      const req = new Request('http://localhost:3001/async-error');
      const res = await server.fetch(req);

      expect(res.status).toBe(500);
      expect(await res.text()).toBe('Internal Server Error');
    });
  });
});
