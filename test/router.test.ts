import { expect, test, describe } from 'bun:test';
import { SuenoRouter } from '../src/router';

describe('SuenoRouter', () => {
  test('creates router with default base path', () => {
    const router = new SuenoRouter();
    expect(router.routes).toBeDefined();
    expect(router.routes.size).toBe(0);
  });

  test('creates router with custom base path', () => {
    const router = new SuenoRouter('/api');

    router.get('/users', async (ctx) => {
      return new Response('users');
    });

    const routes = router.routes.get('GET');
    expect(routes).toBeDefined();
    expect(routes?.has('/api/users')).toBe(true);
  });

  test('registers GET route handler', () => {
    const router = new SuenoRouter();
    const handler = async (ctx: any) => new Response('test');

    router.get('/test', handler);

    const routes = router.routes.get('GET');
    expect(routes).toBeDefined();
    expect(routes?.has('/test')).toBe(true);
  });

  test('registers multiple HTTP methods', () => {
    const router = new SuenoRouter();
    const handler = async (ctx: any) => new Response('test');

    router.get('/test', handler);
    router.post('/test', handler);
    router.put('/test', handler);
    router.delete('/test', handler);

    expect(router.routes.get('GET')?.has('/test')).toBe(true);
    expect(router.routes.get('POST')?.has('/test')).toBe(true);
    expect(router.routes.get('PUT')?.has('/test')).toBe(true);
    expect(router.routes.get('DELETE')?.has('/test')).toBe(true);
  });

  test('normalizes paths with and without leading slash', () => {
    const router = new SuenoRouter('/api');
    const handler = async (ctx: any) => new Response('test');

    router.get('test', handler);
    router.post('/test', handler);

    expect(router.routes.get('GET')?.has('/api/test')).toBe(true);
    expect(router.routes.get('POST')?.has('/api/test')).toBe(true);
  });
});
