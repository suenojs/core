import { createSuenoApi } from './client';
import { SuenoLogger, createLogger } from './logger';
import type { LogLevel } from './logger';
import { createRouter, SuenoRouter } from './router';
import { csrf } from './csrf';
import { HttpStatus } from './types/http';
import type { CommonHttpHeaderName } from './types/http';
import type { RouteHandler } from './types/route';
import type { RouteContext } from './types/context';

// Export types from type files
export type { RouteContext } from './types/context';
export type { SuenoOptions, ServeOptions } from './types/options';
export type { RouteHandler } from './types/route';

// Export core functionality
export { createSuenoApi, SuenoLogger, createLogger, createRouter, csrf, SuenoRouter };

// Export additional types from modules
export type { ApiClientOptions, ApiResponse } from './client';

// Types
interface SuenoOptions {
  logger?: boolean | Logger;
  logLevel?: LogLevel;
  trustProxy?: boolean;
  jsonLimit?: string;
  cors?: CorsOptions;
}

interface ServeOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
  ssl?: SSLOptions;
}

// First, let's improve the ExtractParams type
type ExtractParams<T> = T extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param]: string } & ExtractParams<Rest>
  : T extends `${string}:${infer Param}`
  ? { [K in Param]: string }
  : {};

// Define a type for the context
// export type RouteContext<TPath extends string = string> = BaseContext & {
//   params: ExtractParams<TPath>;
// };
// Enhanced Headers interface with autocomplete
export interface TypedHeaders {
  get(name: CommonHttpHeaderName | string): string | null;
  set(name: CommonHttpHeaderName | string, value: string): void;
  append(name: CommonHttpHeaderName | string, value: string): void;
  delete(name: CommonHttpHeaderName | string): void;
  has(name: CommonHttpHeaderName | string): boolean;
}

// Request body interface with explicit methods
export interface RequestBody {
  /**
   * Parse the request body as JSON
   */
  json<T = any>(): Promise<T>;
}

// Then update the BaseContext class with better documentation and type inference
/**
 * Base context class for request handling
 */
export class BaseContext {
  constructor(
    /** URL parameters extracted from the route path */
    public readonly params: Record<string, string>,
    /** Request body with parsing methods */
    public readonly body: RequestBody,
    /** Logger instance for this request */
    public readonly logger: SuenoLogger,
    /** Mutable state object that can be used to pass data between middleware */
    public state: Record<string, any>,
    /** HTTP method of the request */
    public readonly method: string,
    /** Request/response headers */
    public readonly headers: TypedHeaders,
    /** HTTP status code */
    public status: HttpStatus,
    /** Original request object */
    public readonly request: Request,
    /** URL query parameters */
    public readonly query: URLSearchParams
  ) {}

  /**
   * Set response status code
   * @param code HTTP status code
   */
  setStatus(code: HttpStatus): this {
    this.status = code;
    return this;
  }

  /**
   * Set response header
   * @param name Header name
   * @param value Header value
   */
  setHeader(name: CommonHttpHeaderName | string, value: string): this {
    this.headers.set(name, value);
    return this;
  }

  /**
   * Get request header
   * @param name Header name
   */
  getHeader(name: CommonHttpHeaderName | string): string | null {
    return this.headers.get(name);
  }

  /**
   * Check if request has header
   * @param name Header name
   */
  hasHeader(name: CommonHttpHeaderName | string): boolean {
    return this.headers.has(name);
  }

  /**
   * Send JSON response
   * @param data Data to send
   */
  json<T>(data: T): T {
    this.headers.set('Content-Type', 'application/json');
    return data;
  }

  /**
   * Send text response
   * @param text Text to send
   */
  text(text: string): string {
    this.headers.set('Content-Type', 'text/plain');
    return text;
  }
}

interface Logger {
  info(message: string): void;
  error(message: string): void;
}

interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
}

interface SSLOptions {
  key: string;
  cert: string;
}

// Middleware types
export type NextFunction = () => Promise<void> | void;
export type MiddlewareHandler = (ctx: BaseContext, next: NextFunction) => Promise<void> | void;

interface RouteInfo<TPath extends string = string> {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler<TPath>;
  logger: SuenoLogger;
  middleware?: MiddlewareHandler[];
}

// Update the SuenoRouteMap type
export type SuenoRouteMap = Map<string, Map<string, RouteInfo<string>>>;

class Sueno {
  protected routes: SuenoRouteMap;
  private options: SuenoOptions;
  private logger: SuenoLogger;
  private globalMiddleware: MiddlewareHandler[] = [];

  constructor(options: SuenoOptions = {}) {
    this.options = {
      logger: true,
      logLevel: 'info',
      trustProxy: false,
      jsonLimit: '1mb',
      ...options,
    };
    this.routes = new Map();
    this.logger = createLogger({ level: this.options.logLevel });
  }

  // Add global middleware
  use(handler: MiddlewareHandler) {
    this.globalMiddleware.push(handler);
    return this;
  }

  private async executeMiddleware(ctx: BaseContext, middleware: MiddlewareHandler[]) {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const handler = middleware[i];
      if (handler) {
        await handler(ctx, () => dispatch(i + 1));
      }
    };

    await dispatch(0);
  }

  private parseRoute(path: string): { pattern: RegExp; paramNames: string[] } {
    const paramNames: string[] = [];
    const pattern = path
      .replace(/:[a-zA-Z]+/g, (match) => {
        paramNames.push(match.slice(1));
        return '([^/]+)';
      })
      .replace(/\*/g, '.*');

    return {
      pattern: new RegExp(`^${pattern}$`),
      paramNames,
    };
  }

  private addRoute<TPath extends string>(
    method: string,
    path: TPath,
    handlers: (RouteHandler<TPath> | MiddlewareHandler)[]
  ) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }

    const { pattern, paramNames } = this.parseRoute(path);
    const routeHandler = handlers.pop() as RouteHandler<TPath>;
    const middleware = handlers as MiddlewareHandler[];

    this.routes.get(method)!.set(path, {
      pattern,
      paramNames,
      handler: routeHandler,
      logger: this.logger,
      middleware,
    });
  }

  private matchRoute(
    method: string,
    path: string
  ): {
    handler: RouteHandler;
    params: Record<string, string>;
    logger: SuenoLogger;
    middleware?: MiddlewareHandler[];
  } | null {
    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) return null;

    for (const [_, routeInfo] of methodRoutes) {
      const match = path.match(routeInfo.pattern);
      if (match) {
        const params: Record<string, string> = {};
        routeInfo.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return {
          handler: routeInfo.handler,
          params,
          logger: routeInfo.logger,
          middleware: routeInfo.middleware,
        };
      }
    }
    return null;
  }

  // Update route handlers with explicit types
  get<TPath extends string>(path: TPath, handler: RouteHandler<TPath>): this;
  get<TPath extends string>(
    path: TPath,
    ...handlers: [...MiddlewareHandler[], RouteHandler<TPath>]
  ): this {
    this.addRoute('GET', path, handlers);
    return this;
  }

  post<TPath extends string>(path: TPath, handler: RouteHandler<TPath>): this;
  post<TPath extends string>(
    path: TPath,
    ...handlers: [...MiddlewareHandler[], RouteHandler<TPath>]
  ): this {
    this.addRoute('POST', path, handlers);
    return this;
  }

  put<TPath extends string>(path: TPath, handler: RouteHandler<TPath>): this;
  put<TPath extends string>(
    path: TPath,
    ...handlers: [...MiddlewareHandler[], RouteHandler<TPath>]
  ): this {
    this.addRoute('PUT', path, handlers);
    return this;
  }

  delete<TPath extends string>(path: TPath, handler: RouteHandler<TPath>): this;
  delete<TPath extends string>(
    path: TPath,
    ...handlers: [...MiddlewareHandler[], RouteHandler<TPath>]
  ): this {
    this.addRoute('DELETE', path, handlers);
    return this;
  }

  route(router: SuenoRouter) {
    // Merge the routes from the router
    for (const [method, routes] of router.routes) {
      if (!this.routes.has(method)) {
        this.routes.set(method, new Map());
      }

      for (const [path, routeInfo] of routes) {
        // Create a wrapped handler that uses the router's logger
        const wrappedHandler: RouteHandler<string> = async (ctx: RouteContext<string>) => {
          // Create a new context with the router's logger
          const routerCtx = {
            ...ctx,
            logger: router.logger,
          } as RouteContext<string>;
          return routeInfo.handler(routerCtx);
        };

        // Add the routes to this app's routes with the wrapped handler
        this.routes.get(method)!.set(path, { ...routeInfo, handler: wrappedHandler });
      }
    }
    return this;
  }

  async serve(options: ServeOptions = {}, callback?: (options: ServeOptions) => void) {
    const { port = 3000, hostname = '0.0.0.0', development = false } = options;

    const server = Bun.serve({
      port,
      hostname,
      fetch: async (req) => {
        const url = new URL(req.url);
        const method = req.method;
        const path = url.pathname;

        const route = this.matchRoute(method, path);
        if (route) {
          const typedHeaders: TypedHeaders = {
            get: (name) => req.headers.get(name),
            set: (name, value) => req.headers.set(name, value),
            append: (name, value) => req.headers.append(name, value),
            delete: (name) => req.headers.delete(name),
            has: (name) => req.headers.has(name),
          };

          const ctx = new BaseContext(
            route.params,
            { json: async () => req.json() },
            route.logger,
            {},
            method,
            typedHeaders,
            HttpStatus.OK,
            req,
            url.searchParams
          );

          try {
            // Execute global middleware first
            if (this.globalMiddleware.length > 0) {
              await this.executeMiddleware(ctx, this.globalMiddleware);
            }

            // Execute route-specific middleware
            if (route.middleware && route.middleware.length > 0) {
              await this.executeMiddleware(ctx, route.middleware);
            }

            const result = await route.handler(ctx);
            const response = new Response(
              typeof result === 'string' ? result : JSON.stringify(result),
              {
                status: Number(ctx.status),
                headers: req.headers,
              }
            );

            if (this.options.logger) {
              route.logger.system(Number(ctx.status), `${method} ${path}`);
            }

            return response;
          } catch (error: any) {
            ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
            if (this.options.logger) {
              route.logger.system(Number(ctx.status), `${method} ${path} - ${error.message}`);
            }
            return new Response('Internal Server Error', { status: Number(ctx.status) });
          }
        }

        if (this.options.logger) {
          this.logger.system(Number(HttpStatus.NOT_FOUND), `${method} ${path} - Not Found`);
        }
        return new Response('Not Found', { status: Number(HttpStatus.NOT_FOUND) });
      },
    });

    if (this.options.logger) {
      this.logger.system(Number(HttpStatus.OK), `Server running at http://${hostname}:${port}`);
    }

    return server;
  }
}

// Example usage
const app = new Sueno({
  logger: true,
  trustProxy: true,
});

// Add CSRF protection middleware globally
app.use(
  csrf({
    cookie: {
      secure: process.env.NODE_ENV === 'production', // Only use secure in production
    },
  })
);

app.use((ctx: BaseContext, next: NextFunction) => {
  ctx.logger.info('Global middleware');
  ctx.state.testData = 'test';
  return next();
});

// Update example route handlers with explicit types
app.get('/hello', (ctx) => {
  ctx.logger.info(`State: ${ctx.state.testData}`);
  ctx.status = HttpStatus.MOVED_PERMANENTLY;
  return 'Hello World!';
});

app.get('/hello/json', (ctx) => {
  return { message: 'Hello World!' };
});

app.get('/hello/:id', (ctx) => {
  ctx.logger.debug('Starting to process request...');
  ctx.logger.info(`Processing request for ID: ${ctx.params.id}`);

  if (ctx.params.id === 'error') {
    ctx.logger.error('Invalid ID provided');
    throw new Error('Invalid ID');
  }

  ctx.logger.debug('Request processed successfully');
  return `Hello ${ctx.params.id}!`;
});

app.get('/users/:userId/posts/:postId', (ctx) => {
  ctx.logger.info(`Looking up post for user`);
  ctx.logger.debug(`User ID: ${ctx.params.userId}, Post ID: ${ctx.params.postId}`);
  return `User ${ctx.params.userId}, Post ${ctx.params.postId}`;
});

const someRouter = createRouter('/some/router');
someRouter.get('/hello', (ctx) => {
  return 'Hello from Some Router!';
});

app.route(someRouter);

// Start the server
app.serve(
  {
    port: 3000,
    development: true,
  },
  (options) => {
    console.log(`Server started on http://${options.hostname}:${options.port}`);
  }
);

// const api = createSuenoApi(
//   {
//     baseUrl: 'http://localhost:3000',
//   },
//   app
// );

// api.get('/hello/json').then((res) => {
//   console.log(res);
// });
