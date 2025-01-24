import { SuenoLogger, createLogger } from './logger';
import type { LogLevel } from './logger';
import { SuenoRouter } from './router';
import { HttpStatus } from './types/http';
import type { CommonHttpHeaderName } from './types/http';
import type { RouteHandler } from './types/route';
import type { RouteContext, BaseContext } from './types/context';
import { BaseContextImpl } from './types/context';
import type { MiddlewareHandler, NextFunction } from './types/middleware';
import type { RouteInfo } from './types/route';

// Types
export interface SuenoOptions {
  logger?: boolean | Logger;
  logLevel?: LogLevel;
  trustProxy?: boolean;
  jsonLimit?: string;
  cors?: CorsOptions;
}

export interface ServeOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
  ssl?: SSLOptions;
}

// First, let's improve the ExtractParams type
export type ExtractParams<T> = T extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param]: string } & ExtractParams<Rest>
  : T extends `${string}:${infer Param}`
  ? { [K in Param]: string }
  : {};

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

// Update the SuenoRouteMap type
export type SuenoRouteMap = Map<string, Map<string, RouteInfo>>;

export class Sueno {
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

        // Add the routes to this app's routes with the wrapped handler, but without duplicating middleware
        this.routes.get(method)!.set(path, {
          ...routeInfo,
          handler: wrappedHandler,
          middleware: [], // Remove middleware to prevent double execution
        });
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
        const startTime = Date.now();
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

          const ctx = new BaseContextImpl(
            req,
            route.params,
            { json: async () => req.json() },
            route.logger,
            {},
            method,
            typedHeaders,
            HttpStatus.OK,
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
              const duration = Date.now() - startTime;
              route.logger.request(method, path, Number(ctx.status), { duration });
            }

            return response;
          } catch (error: any) {
            ctx.status = HttpStatus.INTERNAL_SERVER_ERROR;
            if (this.options.logger) {
              const duration = Date.now() - startTime;
              route.logger.request(method, path, Number(ctx.status), {
                duration,
                error: error.message,
              });
            }
            return new Response('Internal Server Error', { status: Number(ctx.status) });
          }
        }

        if (this.options.logger) {
          const duration = Date.now() - startTime;
          this.logger.request(method, path, Number(HttpStatus.NOT_FOUND), { duration });
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
