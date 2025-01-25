import type { CacheStore } from '../../types/cache';
import Redis from 'ioredis';

export class RedisStore implements CacheStore {
  private client: Redis;

  constructor(host: string, port: number, password?: string, db?: number) {
    this.client = new Redis({
      host,
      port,
      password,
      db,
      lazyConnect: true,
    });
  }

  async get<T>(key: string): Promise<T | null> {
    const value = await this.client.get(key);
    if (!value) return null;

    try {
      return JSON.parse(value) as T;
    } catch {
      return value as unknown as T;
    }
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    const serializedValue = typeof value === 'string' ? value : JSON.stringify(value);

    if (ttl) {
      await this.client.setex(key, ttl, serializedValue);
    } else {
      await this.client.set(key, serializedValue);
    }
  }

  async delete(key: string): Promise<void> {
    await this.client.del(key);
  }

  async clear(): Promise<void> {
    await this.client.flushdb();
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}
