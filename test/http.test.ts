import { expect, test, describe } from 'bun:test';
import { SuenoRouter } from '../src/router';
import { HttpStatus } from '../src/types/http';
import type { RouteInfo } from '../src/types/route';
import { createLogger } from '../src/logger';
import type { TypedHeaders, RequestBody } from '../src/types/http';

// Helper function to create a minimal test context
function createTestContext(request: Request, params = {}) {
  const headers: TypedHeaders = {
    get: (name) => request.headers.get(name),
    set: (name, value) => request.headers.set(name, value),
    append: (name, value) => request.headers.append(name, value),
    delete: (name) => request.headers.delete(name),
    has: (name) => request.headers.has(name),
  };

  const body: RequestBody = {
    json: async <T>() => ({} as T),
  };

  return {
    request,
    headers,
    body,
    query: new URLSearchParams(),
    params,
    logger: createLogger({ name: 'test' }),
    state: {},
    method: request.method,
    status: HttpStatus.OK,
  };
}

describe('HTTP Handling', () => {
  test('handles JSON responses', async () => {
    const router = new SuenoRouter();
    const testData = { message: 'Hello World' };

    router.get('/json', async (ctx) => {
      return Response.json(testData);
    });

    const routes = router.routes.get('GET');
    const routeInfo = routes?.get('/json') as RouteInfo;
    expect(routeInfo).toBeDefined();
    expect(routeInfo.handler).toBeDefined();

    const response = await routeInfo.handler(
      createTestContext(new Request('http://localhost/json'))
    );

    expect(response).toBeInstanceOf(Response);
    expect(response.headers.get('content-type')).toBe('application/json');
    expect(await response.json()).toEqual(testData);
  });

  test('handles different HTTP status codes', async () => {
    const router = new SuenoRouter();

    router.get('/ok', async () => new Response('OK', { status: HttpStatus.OK }));
    router.get('/created', async () => new Response('Created', { status: HttpStatus.CREATED }));
    router.get(
      '/not-found',
      async () => new Response('Not Found', { status: HttpStatus.NOT_FOUND })
    );

    const routes = router.routes.get('GET');

    for (const [path, expectedStatus] of [
      ['/ok', HttpStatus.OK],
      ['/created', HttpStatus.CREATED],
      ['/not-found', HttpStatus.NOT_FOUND],
    ] as const) {
      const routeInfo = routes?.get(path) as RouteInfo;
      const response = await routeInfo.handler(
        createTestContext(new Request(`http://localhost${path}`))
      );
      expect(response.status).toBe(expectedStatus);
    }
  });

  test('handles custom headers', async () => {
    const router = new SuenoRouter();
    const customHeaders = {
      'X-Custom-Header': 'custom-value',
      'Content-Type': 'application/json',
    };

    router.get('/headers', async () => {
      return new Response(JSON.stringify({ test: true }), {
        headers: customHeaders,
      });
    });

    const routes = router.routes.get('GET');
    const routeInfo = routes?.get('/headers') as RouteInfo;

    const response = await routeInfo.handler(
      createTestContext(new Request('http://localhost/headers'))
    );

    expect(response.headers.get('X-Custom-Header')).toBe('custom-value');
    expect(response.headers.get('Content-Type')).toBe('application/json');
  });

  test('handles URL parameters', async () => {
    const router = new SuenoRouter();

    router.get('/users/:id', async (ctx) => {
      return Response.json({ id: ctx.params.id });
    });

    const routes = router.routes.get('GET');
    const routeInfo = routes?.get('/users/:id') as RouteInfo;

    const response = await routeInfo.handler(
      createTestContext(new Request('http://localhost/users/123'), { id: '123' })
    );

    const data = await response.json();
    expect(data.id).toBe('123');
  });
});
