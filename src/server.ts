import { SuenoLogger, createLogger } from './logger';
import type { LogLevel } from './logger';
import { HttpStatus } from './types/http';
import type { CommonHttpHeaderName } from './types/http';
import type { RouteHandler, HandlerContext } from './types/route';
import type { BaseContext } from './types/context';
import { BaseContextImpl } from './types/context';
import type { MiddlewareHandler, RouteMiddlewareHandler } from './types/middleware';
import type { RouteInfo } from './types/route';

// Types
export interface SuenoOptions {
  logger?: boolean | Logger;
  logLevel?: LogLevel;
  trustProxy?: boolean;
  jsonLimit?: string;
  cors?: CorsOptions;
  baseUrl?: string;
}

export interface ServeOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
  ssl?: SSLOptions;
}

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
  private basePath: string;

  constructor(optionsOrBasePath: SuenoOptions | string = {}) {
    const options =
      typeof optionsOrBasePath === 'string' ? { baseUrl: optionsOrBasePath } : optionsOrBasePath;

    this.options = {
      logger: true,
      logLevel: 'info',
      trustProxy: false,
      jsonLimit: '1mb',
      ...options,
    };
    this.basePath = this.options.baseUrl?.startsWith('/')
      ? this.options.baseUrl
      : `/${this.options.baseUrl || ''}`;
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

  private normalizePath(path: string): string {
    // Remove leading and trailing slashes
    const cleanPath = path.replace(/^\/+|\/+$/g, '');

    // Combine base path with the route path
    const basePath = this.basePath.replace(/^\/+|\/+$/g, '');
    const fullPath = basePath ? `${basePath}/${cleanPath}` : cleanPath;

    // Ensure leading slash and no trailing slash
    return `/${fullPath.replace(/\/+/g, '/')}`;
  }

  private addRoute<Path extends string>(
    method: string,
    path: Path,
    handlers: [
      ...Array<MiddlewareHandler | RouteMiddlewareHandler<Path>>,
      (ctx: HandlerContext<Path>) => Promise<any> | any
    ]
  ) {
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }

    const fullPath = this.normalizePath(path);
    this.logger.debug(`Adding route: ${method} ${fullPath}`);

    const { pattern, paramNames } = this.parseRoute(fullPath);
    const routeHandler = handlers[handlers.length - 1] as RouteHandler<Path>;
    const middleware = handlers.slice(0, -1) as Array<
      MiddlewareHandler | RouteMiddlewareHandler<Path>
    >;

    this.routes.get(method)!.set(fullPath, {
      pattern,
      paramNames,
      handler: routeHandler,
      logger: this.logger,
      middleware,
    });
  }

  private matchRoute<TPath extends string>(
    method: string,
    path: TPath
  ): {
    handler: RouteHandler<TPath>;
    params: Record<string, string>;
    logger: SuenoLogger;
    middleware?: (MiddlewareHandler | RouteMiddlewareHandler<TPath>)[];
  } | null {
    const methodRoutes = this.routes.get(method);
    if (!methodRoutes) {
      this.logger.debug(`No routes found for method ${method}`);
      return null;
    }

    this.logger.debug(`Matching path: ${path}`);
    this.logger.debug(`Available routes: ${Array.from(methodRoutes.keys()).join(', ')}`);

    for (const [routePath, routeInfo] of methodRoutes) {
      this.logger.debug(`Checking route ${routePath} with pattern ${routeInfo.pattern}`);
      const match = path.match(routeInfo.pattern);
      if (match) {
        this.logger.debug(`Matched route ${routePath}`);
        const params: Record<string, string> = {};
        routeInfo.paramNames.forEach((name, i) => {
          params[name] = match[i + 1];
        });
        return {
          handler: routeInfo.handler as RouteHandler<TPath>,
          params,
          logger: routeInfo.logger,
          middleware: routeInfo.middleware as (MiddlewareHandler | RouteMiddlewareHandler<TPath>)[],
        };
      }
    }
    this.logger.debug(`No matching route found for ${path}`);
    return null;
  }

  // Update route handlers with generic context support
  get<Path extends string>(
    path: Path,
    handler: (ctx: HandlerContext<Path>) => Promise<any> | any
  ): this;
  get<Path extends string>(
    path: Path,
    ...handlers: [
      ...Array<MiddlewareHandler | RouteMiddlewareHandler<Path>>,
      (ctx: HandlerContext<Path>) => Promise<any> | any
    ]
  ): this {
    this.addRoute('GET', path, handlers);
    return this;
  }

  post<Path extends string>(
    path: Path,
    handler: (ctx: HandlerContext<Path>) => Promise<any> | any
  ): this;
  post<Path extends string>(
    path: Path,
    ...handlers: [
      ...Array<MiddlewareHandler | RouteMiddlewareHandler<Path>>,
      (ctx: HandlerContext<Path>) => Promise<any> | any
    ]
  ): this {
    this.addRoute('POST', path, handlers);
    return this;
  }

  put<Path extends string>(
    path: Path,
    handler: (ctx: HandlerContext<Path>) => Promise<any> | any
  ): this;
  put<Path extends string>(
    path: Path,
    ...handlers: [
      ...Array<MiddlewareHandler | RouteMiddlewareHandler<Path>>,
      (ctx: HandlerContext<Path>) => Promise<any> | any
    ]
  ): this {
    this.addRoute('PUT', path, handlers);
    return this;
  }

  delete<Path extends string>(
    path: Path,
    handler: (ctx: HandlerContext<Path>) => Promise<any> | any
  ): this;
  delete<Path extends string>(
    path: Path,
    ...handlers: [
      ...Array<MiddlewareHandler | RouteMiddlewareHandler<Path>>,
      (ctx: HandlerContext<Path>) => Promise<any> | any
    ]
  ): this {
    this.addRoute('DELETE', path, handlers);
    return this;
  }

  route(router: Sueno) {
    // Merge the routes from the router
    for (const [method, routes] of router.routes) {
      if (!this.routes.has(method)) {
        this.routes.set(method, new Map());
      }

      for (const [path, routeInfo] of routes) {
        // Create a wrapped handler that uses the router's logger
        const wrappedHandler = async (ctx: HandlerContext<string>) => {
          // Create a new context with the router's logger
          const routerCtx = {
            ...ctx,
            logger: router.logger,
          } as HandlerContext<string>;
          return routeInfo.handler(routerCtx);
        };

        // Add the routes to this app's routes with the wrapped handler
        // Get the router's relative path by removing its base path
        const routerBasePath = router.basePath.replace(/^\//, '').replace(/\/$/, '');

        // Remove the router's base path from the route path if it starts with it
        let routePath = path.replace(/^\//, '').replace(/\/$/, '');
        if (routePath.startsWith(routerBasePath + '/')) {
          routePath = routePath.slice(routerBasePath.length + 1);
        } else if (routePath === routerBasePath) {
          routePath = '';
        }

        const combinedPath = routerBasePath
          ? routePath
            ? `${routerBasePath}/${routePath}`
            : routerBasePath
          : routePath;

        const fullPath = this.normalizePath(combinedPath);

        this.logger.debug(
          `Mounting route from router: ${method} ${fullPath} (router base: ${router.basePath}, route: ${path})`
        );

        const { pattern, paramNames } = this.parseRoute(fullPath);
        this.routes.get(method)!.set(fullPath, {
          ...routeInfo,
          pattern,
          paramNames,
          handler: wrappedHandler,
          logger: router.logger,
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

        this.logger.debug(`Incoming request: ${method} ${path}`);

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
            url.searchParams,
            path,
            {
              openapi: '3.0.0',
              info: {
                title: 'API',
                version: '1.0.0',
              },
              paths: {},
              components: {
                schemas: {},
              },
            },
            {
              get: async () => null,
              set: async () => {},
              delete: async () => {},
              clear: async () => {},
            }
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
