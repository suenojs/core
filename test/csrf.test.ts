import { expect, test, describe } from 'bun:test';
import { csrf } from '../src/csrf';
import { createLogger } from '../src/logger';
import { HttpStatus } from '../src/types/http';
import type { TypedHeaders, RequestBody } from '../src/types/http';
import { BaseContextImpl } from '../src/types/context';

// Helper function to create a test context (reusing from cors.test.ts)
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

describe('CSRF Middleware', () => {
  test('allows safe methods without token', async () => {
    const csrfMiddleware = csrf();
    const request = new Request('http://localhost/test', {
      method: 'GET',
    });

    const ctx = createTestContext(request);
    let nextCalled = false;
    await csrfMiddleware(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });

  test('generates and validates CSRF token', async () => {
    const csrfMiddleware = csrf();
    const request = new Request('http://localhost/test', {
      method: 'GET',
    });

    const ctx = createTestContext(request);
    await csrfMiddleware(ctx, async () => {});

    const token = ctx.headers.get('csrf-token');
    expect(token).toBeDefined();
    expect(token?.includes('.')).toBe(true);

    // Test token validation with a POST request
    const postRequest = new Request('http://localhost/test', {
      method: 'POST',
      headers: {
        'csrf-token': token!,
      },
    });

    const postCtx = createTestContext(postRequest);
    let nextCalled = false;
    await csrfMiddleware(postCtx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });

  test('blocks unsafe methods without valid token', async () => {
    const csrfMiddleware = csrf();
    const request = new Request('http://localhost/test', {
      method: 'POST',
    });

    const ctx = createTestContext(request);
    let nextCalled = false;
    let error: Error | undefined;

    try {
      await csrfMiddleware(ctx, async () => {
        nextCalled = true;
      });
    } catch (e) {
      error = e as Error;
    }

    expect(nextCalled).toBe(false);
    expect(error).toBeDefined();
    expect(error?.message).toInclude('CSRF');
  });

  test('uses custom token key', async () => {
    const customTokenKey = 'x-custom-csrf';
    const csrfMiddleware = csrf({ tokenKey: customTokenKey });

    const request = new Request('http://localhost/test', {
      method: 'GET',
    });

    const ctx = createTestContext(request);
    await csrfMiddleware(ctx, async () => {});

    const token = ctx.headers.get(customTokenKey);
    expect(token).toBeDefined();

    // Test token validation with a POST request using custom key
    const postRequest = new Request('http://localhost/test', {
      method: 'POST',
      headers: {
        [customTokenKey]: token!,
      },
    });

    const postCtx = createTestContext(postRequest);
    let nextCalled = false;
    await csrfMiddleware(postCtx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);
  });

  test('respects custom ignored methods', async () => {
    const csrfMiddleware = csrf({ ignoreMethods: ['GET', 'PUT'] });

    // PUT should be allowed without token
    const request = new Request('http://localhost/test', {
      method: 'PUT',
    });

    const ctx = createTestContext(request);
    let nextCalled = false;
    await csrfMiddleware(ctx, async () => {
      nextCalled = true;
    });

    expect(nextCalled).toBe(true);

    // POST should still be blocked
    const postRequest = new Request('http://localhost/test', {
      method: 'POST',
    });

    const postCtx = createTestContext(postRequest);
    let postNextCalled = false;
    let error: Error | undefined;

    try {
      await csrfMiddleware(postCtx, async () => {
        postNextCalled = true;
      });
    } catch (e) {
      error = e as Error;
    }

    expect(postNextCalled).toBe(false);
    expect(error).toBeDefined();
  });
});
