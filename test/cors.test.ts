import { expect, test, describe } from 'bun:test';
import { cors } from '../src/cors';
import { createLogger } from '../src/logger';
import { HttpStatus } from '../src/types/http';
import type { TypedHeaders, RequestBody } from '../src/types/http';
import { BaseContextImpl } from '../src/types/context';

// Helper function to create a test context
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

  const logger = createLogger({ name: 'test' });

  return new BaseContextImpl(
    request,
    params,
    body,
    logger,
    {},
    request.method,
    headers,
    HttpStatus.OK,
    new URLSearchParams(request.url.split('?')[1] || '')
  );
}

describe('CORS Middleware', () => {
  test('handles preflight requests with default options', async () => {
    const corsMiddleware = cors();
    const request = new Request('http://localhost/test', {
      method: 'OPTIONS',
      headers: {
        Origin: '*',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    });

    const ctx = createTestContext(request);
    let nextCalled = false;
    await corsMiddleware(ctx, async () => {
      nextCalled = true;
    });

    expect(ctx.headers.get('Access-Control-Allow-Origin')).toBe('*');
    expect(ctx.headers.get('Access-Control-Allow-Methods')).toInclude('POST');
    expect(ctx.headers.get('Access-Control-Allow-Headers')).toBe('content-type');
    expect(nextCalled).toBe(true);
  });

  test('handles actual requests with custom origin', async () => {
    const allowedOrigin = 'http://example.com';
    const corsMiddleware = cors({ origin: allowedOrigin });
    const request = new Request('http://localhost/test', {
      method: 'GET',
      headers: {
        Origin: allowedOrigin,
      },
    });

    const ctx = createTestContext(request);
    await corsMiddleware(ctx, async () => {});

    expect(ctx.headers.get('Access-Control-Allow-Origin')).toBe(allowedOrigin);
  });

  test('handles multiple allowed origins', async () => {
    const allowedOrigins = ['http://example.com', 'http://localhost:3000'];
    const corsMiddleware = cors({ origin: allowedOrigins });
    const request = new Request('http://localhost/test', {
      method: 'GET',
      headers: {
        Origin: allowedOrigins[0],
      },
    });

    const ctx = createTestContext(request);
    await corsMiddleware(ctx, async () => {});

    expect(ctx.headers.get('Access-Control-Allow-Origin')).toBe(allowedOrigins[0]);
  });

  test('handles credentials', async () => {
    const corsMiddleware = cors({ credentials: true });
    const request = new Request('http://localhost/test', {
      method: 'GET',
      headers: {
        Origin: 'http://example.com',
      },
    });

    const ctx = createTestContext(request);
    await corsMiddleware(ctx, async () => {});

    expect(ctx.headers.get('Access-Control-Allow-Credentials')).toBe('true');
  });

  test('handles exposed headers', async () => {
    const exposedHeaders = ['Content-Length', 'X-Custom'];
    const corsMiddleware = cors({ exposedHeaders });
    const request = new Request('http://localhost/test', {
      method: 'GET',
      headers: {
        Origin: 'http://example.com',
      },
    });

    const ctx = createTestContext(request);
    await corsMiddleware(ctx, async () => {});

    expect(ctx.headers.get('Access-Control-Expose-Headers')).toBe(exposedHeaders.join(', '));
  });
});
