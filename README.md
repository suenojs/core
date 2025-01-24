# Sueno - Elegant Backend Framework for Bun.js 🚀

Sueno is a modern, high-performance backend framework built for Bun.js, designed to make server-side development a breeze while maintaining type safety and excellent developer experience.

> "Sueño" (Spanish for "dream") represents our vision of creating the ideal backend development experience - where building servers is as smooth as a pleasant dream. ✨

## ✨ Key Features

- 🔥 **Blazing Fast Performance** - Built on top of Bun.js for maximum speed
- 🎯 **Type Safety** - First-class TypeScript support out of the box
- 🛡️ **Built-in Validation** - Powerful request validation using Zod
- 🔄 **Intuitive Routing** - Express-style routing with enhanced features
- 🌐 **WebSocket Support** - Real-time communication made simple
- 🛠️ **Middleware System** - Flexible middleware architecture
- 🔌 **Plugin System** - Extensible through plugins
- 📝 **Great Documentation** - Comprehensive guides and examples

## 🚀 Quick Start

```bash
# Create a new project
bun create sueno-app

# Install dependencies
bun install

# Start development server
bun dev
```

## 📚 Documentation

- [Server Setup and Configuration](temp-docs/server.md)
- [Routing Guide](temp-docs/routing.md)
- [Request Validation](temp-docs/validation.md)
- [Middleware System](temp-docs/middleware.md)
- [WebSocket Integration](temp-docs/websocket.md)

## 🌟 Core Concepts

### Routing

```typescript
import { Sueno } from '@sueno/core';
const app = new Sueno();

app.get('/hello', (ctx) => {
  return 'Hello World!';
});

app.post('/users', async (ctx) => {
  const user = await ctx.body.json();
  return { message: 'User created' };
});
```

### Validation

```typescript
const userSchema = z.object({
  name: z.string(),
  email: z.string().email(),
});

app.post('/users', validate({ body: userSchema }), async (ctx) => {
  const user = await ctx.body.json();
  return { success: true };
});
```

## 🛠️ Planned Features

- 📦 Built-in Database Integrations
- 🔑 Authentication Providers
- 🚦 Rate Limiting
- 📊 Request Logging & Monitoring
- 🔄 Auto-reload in Development
- 📝 OpenAPI/Swagger Integration
- 🧪 Testing Utilities

## 📜 License

MIT

## 🤝 Contributing

We welcome contributions! Please see our contributing guide for details.

---

Built with ❤️ for the Bun.js community
