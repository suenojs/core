import { expect, test, describe } from 'bun:test';
import { createRouter, SuenoRouter } from '../src/router';
import { HttpStatus } from '../src/types/http';
import { cors } from '../src/cors';
import { csrf } from '../src/csrf';
import type { RouteContext } from '../src/types/context';
import { createLogger } from '../src/logger';
import { BaseContextImpl } from '../src/types/context';

type NextFunction = () => Promise<void | Response>;
type Middleware = (ctx: RouteContext, next: NextFunction) => Promise<void | Response>;

// Helper function to create test context (reusing from other test files)
function createTestContext(request: Request, params = {}) {
  const headers = new Headers();
  const logger = createLogger({ name: 'test' });

  return new BaseContextImpl(
    request,
    params,
    { json: async <T>() => ({} as T) },
    logger,
    {},
    request.method,
    {
      get: (name) => headers.get(name),
      set: (name, value) => headers.set(name, value),
      append: (name, value) => headers.append(name, value),
      delete: (name) => headers.delete(name),
      has: (name) => headers.has(name),
    },
    HttpStatus.OK,
    new URLSearchParams(request.url.split('?')[1] || '')
  );
}

describe('Core Server Functionality', () => {
  test('creates router with middleware chain', async () => {
    const router = new SuenoRouter();
    const middlewareCalls: string[] = [];

    // Add multiple middleware
    const middleware1: Middleware = async (ctx: RouteContext, next: NextFunction) => {
      middlewareCalls.push('middleware1');
      await next();
      middlewareCalls.push('middleware1-after');
    };

    const middleware2: Middleware = async (ctx: RouteContext, next: NextFunction) => {
      middlewareCalls.push('middleware2');
      await next();
      middlewareCalls.push('middleware2-after');
    };

    router.get('/test', async (ctx) => {
      middlewareCalls.push('handler');
      return new Response('OK');
    });

    // Simulate request with middleware chain
    const routes = router.routes.get('GET');
    const routeInfo = routes?.get('/test');
    expect(routeInfo).toBeDefined();

    const ctx = createTestContext(new Request('http://localhost/test'));

    // Execute middleware chain manually
    await middleware1(ctx, async () => {
      await middleware2(ctx, async () => {
        if (routeInfo) {
          await routeInfo.handler(ctx);
        }
      });
    });

    expect(middlewareCalls).toEqual([
      'middleware1',
      'middleware2',
      'handler',
      'middleware2-after',
      'middleware1-after',
    ]);
  });

  test('handles nested routers', async () => {
    const mainRouter = new SuenoRouter();
    const apiRouter = new SuenoRouter('/api');
    const userRouter = new SuenoRouter('/users');

    userRouter.get('/:id', async (ctx) => {
      return Response.json({ id: ctx.params.id });
    });

    // Mount routers
    const routes = mainRouter.routes.get('GET');
    const apiRoutes = apiRouter.routes.get('GET');
    const userRoutes = userRouter.routes.get('GET');

    if (userRoutes && apiRoutes && routes) {
      // Manually combine routes for testing
      for (const [path, handler] of userRoutes.entries()) {
        apiRoutes.set(`/users${path}`, handler);
      }
      for (const [path, handler] of apiRoutes.entries()) {
        routes.set(`/api${path}`, handler);
      }
    }

    const routeInfo = routes?.get('/api/users/:id');
    expect(routeInfo).toBeDefined();

    const ctx = createTestContext(new Request('http://localhost/api/users/123'), { id: '123' });

    const response = await routeInfo?.handler(ctx);
    expect(response).toBeDefined();
    const data = await response?.json();
    expect(data).toEqual({ id: '123' });
  });

  test('integrates CORS and CSRF middleware', async () => {
    const router = new SuenoRouter();
    const corsMiddleware = cors();
    const csrfMiddleware = csrf();

    router.get('/api/data', async (ctx) => {
      return Response.json({ success: true });
    });

    const routes = router.routes.get('GET');
    const routeInfo = routes?.get('/api/data');
    expect(routeInfo).toBeDefined();

    // First make a GET request to get CSRF token
    const getCtx = createTestContext(new Request('http://localhost/api/data', { method: 'GET' }));

    // Execute middleware chain
    await corsMiddleware(getCtx, async () => {
      await csrfMiddleware(getCtx, async () => {
        if (routeInfo) {
          await routeInfo.handler(getCtx);
        }
      });
    });

    const csrfToken = getCtx.headers.get('csrf-token');
    expect(csrfToken).toBeDefined();

    // Then make POST request with CSRF token
    const postCtx = createTestContext(
      new Request('http://localhost/api/data', {
        method: 'POST',
        headers: {
          Origin: 'http://localhost',
          'csrf-token': csrfToken!,
        },
      })
    );

    // Execute middleware chain
    let response: Response | undefined;
    await corsMiddleware(postCtx, async () => {
      await csrfMiddleware(postCtx, async () => {
        if (routeInfo) {
          response = await routeInfo.handler(postCtx);
        }
      });
    });

    expect(response).toBeDefined();
    expect(response?.status).toBe(200);
  });

  test('handles errors in middleware chain', async () => {
    const router = new SuenoRouter();

    const errorHandler: Middleware = async (ctx: RouteContext, next: NextFunction) => {
      try {
        await next();
      } catch (error) {
        ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
      }
    };

    router.get('/error', async () => {
      throw new Error('Test error');
    });

    const routes = router.routes.get('GET');
    const routeInfo = routes?.get('/error');
    expect(routeInfo).toBeDefined();

    const ctx = createTestContext(new Request('http://localhost/error'));

    const response = await errorHandler(ctx, async () => {
      if (routeInfo) {
        return await routeInfo.handler(ctx);
      }
    });

    expect(response).toBeDefined();
    expect(response?.status).toBe(500);
    const data = await response?.json();
    expect(data).toEqual({ error: 'Internal Server Error' });
  });
});
