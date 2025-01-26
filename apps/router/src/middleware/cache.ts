import type { MiddlewareHandler } from '../types/middleware';
import type { CacheConfig, CacheStore, CacheTypeConfig, CacheContext } from '../types/cache';
import { InMemoryStore } from '../cache/stores/memory';
import { RedisStore } from '../cache/stores/redis';

// Extend BaseContext with cache methods
declare module '../types/context' {
  interface BaseContext extends CacheContext {}
}

export function createCacheMiddleware(
  config: CacheConfig,
  typeConfigs: CacheTypeConfig<any>[] = [],
) {
  let store: CacheStore;

  switch (config.store.type) {
    case 'memory':
      store = new InMemoryStore(config.store.maxSize);
      break;
    case 'redis':
      store = new RedisStore(
        config.store.host,
        config.store.port,
        config.store.password,
        config.store.db,
      );
      break;
    default:
      throw new Error('Invalid store type');
  }

  const typePatterns = new Map(typeConfigs.map((tc) => [tc.pattern, tc.type]));

  const middleware: MiddlewareHandler = async (ctx, next) => {
    // Add cache methods to context
    ctx.cache = {
      async get<T = any>(key: string): Promise<T | null> {
        const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;

        // Check if key matches any type pattern
        for (const [pattern, type] of typePatterns) {
          if (key.match(new RegExp(pattern))) {
            const value = await store.get<T>(fullKey);
            if (value) {
              // Instantiate the type if a value is found
              return Object.assign(new type(), value);
            }
            return null;
          }
        }

        return store.get<T>(fullKey);
      },

      async set<T>(key: string, value: T, ttl?: number): Promise<void> {
        const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
        return store.set(fullKey, value, ttl ?? config.ttl);
      },

      async delete(key: string): Promise<void> {
        const fullKey = config.keyPrefix ? `${config.keyPrefix}:${key}` : key;
        return store.delete(fullKey);
      },

      async clear(): Promise<void> {
        return store.clear();
      },
    };

    await next();
  };

  return middleware;
}
