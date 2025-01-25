export interface CacheStore {
  get<T = any>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttl?: number): Promise<void>;
  delete(key: string): Promise<void>;
  clear(): Promise<void>;
}

export interface RedisConfig {
  type: 'redis';
  host: string;
  port: number;
  password?: string;
  db?: number;
}

export interface InMemoryConfig {
  type: 'memory';
  maxSize?: number; // Maximum number of items to store
}

export type CacheConfig = {
  ttl?: number; // Default TTL in seconds
  keyPrefix?: string;
  store: RedisConfig | InMemoryConfig;
};

export interface CacheTypeConfig<T> {
  pattern: string;
  type: new () => T;
}

export interface CacheContext extends Record<string, any> {
  cache: {
    get<T = any>(key: string): Promise<T | null>;
    set<T>(key: string, value: T, ttl?: number): Promise<void>;
    delete(key: string): Promise<void>;
    clear(): Promise<void>;
  };
}
