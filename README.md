# Sueno - Zero-Config & High-Performance Tools for Lazy Developers 🦥

## 💭 Why I'm Developing Sueno

> As a fullstack developer focusing primarily on backend, I found myself repeating the same setup in every project - configuring loggers, setting up background workers with BullMQ, implementing caching mechanisms, connecting to MinIO for media storage, and much more. I got tired of it.
>
> I wanted a toolkit that would let me focus on building features instead of infrastructure. Something I could just npm install and start using immediately with minimal configuration. That's why I created Sueno - a collection of tools that are simple, fast, and just work.
>
> All tools are built Bun-first (with Node.js support) because I believe in embracing modern JavaScript runtimes.

## ⚡ Key Features

- **Framework Agnostic**: Works with any framework - Express, Fastify, Hono, or no framework at all
- **Zero Configuration**: Start using immediately with sensible defaults
- **Highly Performant**: Built with performance in mind
- **TypeScript First**: Full type safety out of the box
- **Mix and Match**: Use only what you need - each tool works independently
- **Progressive Complexity**: Easy to start, powerful when you need more

## 🛠️ Available Tools

### 📝 Logger (@sueno/logger)

Simple logging that just works:

```typescript
import { logger } from '@sueno/logger';
// That's it! Start logging:
logger.info('Ready to go!');
```

- Pretty console output out of the box
- Production-ready when you need it
- Zero configuration needed (but customizable if you want)
- Works with any Node.js/Bun framework

### 🔄 Cache (@sueno/cache) [Coming Soon]

Straightforward caching:

```typescript
import { cache } from '@sueno/cache';
// Simple as that:
await cache.set('key', value);
```

- Works instantly with in-memory storage
- Redis support without configuration hell
- Type-safe by default
- Framework independent implementation

### 👷 Worker (@sueno/worker) [Coming Soon]

Background jobs made simple:

```typescript
import { worker } from '@sueno/worker';
// Just add your job:
await worker.add('email', { to: 'user@example.com' });
```

- Built on BullMQ but without the setup complexity
- Sensible defaults that work for most cases
- Persistent storage included
- Use with any application structure

### 📁 Storage (@sueno/storage) [Coming Soon]

Simple MinIO/S3 file handling:

```typescript
import { storage } from '@sueno/storage';
// Upload files easily:
await storage.upload('avatar.png', fileBuffer);
```

## 📦 Installation

```bash
# Pick what you need:
bun add @sueno/logger
bun add @sueno/cache    # coming soon
bun add @sueno/worker   # coming soon
bun add @sueno/storage  # coming soon
```

## 💡 Philosophy

- **Zero Config**: Everything works out of the box
- **Bun First**: Optimized for Bun.js, but works with Node.js
- **Type Safety**: Full TypeScript support without the hassle
- **Just Works**: Sensible defaults over complex configurations
- **Developer Focused**: Built by developers, for developers
- **Framework Independence**: No lock-in to specific frameworks or architectures
- **Easy to Learn, Hard to Master**: Start simple, scale with power features

## 🎯 Progressive Power

While Sueno is designed to work out of the box, each tool provides rich APIs and configuration options for power users:

```typescript
// Simple usage
import { logger } from '@sueno/logger';
logger.info('Hello!');

// Advanced usage
import { createLogger } from '@sueno/logger';
const logger = createLogger({
  level: 'debug',
  transport: customTransport,
  hooks: {
    onError: async (error) => {
      await notify(error);
    },
  },
  // ... many more options for power users
});
```

Each tool follows this philosophy - zero config to start, but with a rich ecosystem of features when you need them:

- **Logger**: Custom transports, hooks, formatting
- **Cache**: Advanced invalidation strategies, custom stores
- **Worker**: Complex job orchestration, custom processors
- **Storage**: Custom providers, advanced file processing

## 📜 License

Apache 2.0

## 🤝 Contributing

Found a way to make it even simpler? We'd love to hear it! Contributions welcome.

## 📱 Contact

Have questions? Reach out to me on Telegram: [@klimetzc](https://t.me/klimetzc)

---

Built by developers who value their time 🚀
