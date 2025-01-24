import { SuenoLogger, createLogger } from './logger';
import type { LogLevel } from './logger';
import type { RouteContext } from './types/context';
import type { RouteHandler, SuenoRouteMap } from './types/route';

export class SuenoRouter {
  public routes: SuenoRouteMap;
  public logger: SuenoLogger;
  private basePath: string;

  private generateNameFromPath(path: string): string {
    // Remove leading/trailing slashes and split into segments
    const segments = path.replace(/^\/|\/$/g, '').split('/');

    // Filter out empty segments and convert each segment to uppercase
    const formattedSegments = segments
      .filter((segment) => segment.length > 0)
      .map((segment) => {
        if (segment.startsWith(':')) {
          // For parameters, remove the colon and wrap in curly braces
          return `{${segment.slice(1).toUpperCase()}}`;
        }
        return segment.toUpperCase();
      });

    // Join segments with dashes
    return formattedSegments.join('-') || 'ROOT';
  }

  constructor(basePath: string = '', options: { name?: string; logLevel?: LogLevel } = {}) {
    this.basePath = basePath.startsWith('/') ? basePath : `/${basePath}`;
    this.routes = new Map();
    const routerName = options.name || this.generateNameFromPath(this.basePath);
    this.logger = createLogger({
      name: routerName,
      level: options.logLevel || 'info',
    });
  }

  private normalizePath(path: string): string {
    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.basePath}${normalizedPath}`;
  }

  private addRoute<TPath extends string>(method: string, path: TPath, handler: RouteHandler<any>) {
    const fullPath = this.normalizePath(path);
    if (!this.routes.has(method)) {
      this.routes.set(method, new Map());
    }

    // Create a wrapped handler that uses the router's logger
    const wrappedHandler: RouteHandler = async (ctx: RouteContext) => {
      // Replace the context logger with the router's logger
      const routerCtx = { ...ctx, logger: this.logger };
      return handler(routerCtx);
    };

    const { pattern, paramNames } = this.parseRoute(fullPath);
    this.routes.get(method)!.set(fullPath, {
      pattern,
      paramNames,
      handler: wrappedHandler,
      logger: this.logger,
    });
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

  get<TPath extends string>(path: TPath, handler: RouteHandler<any>) {
    this.addRoute('GET', path, handler);
    return this;
  }

  post<TPath extends string>(path: TPath, handler: RouteHandler<any>) {
    this.addRoute('POST', path, handler);
    return this;
  }

  put<TPath extends string>(path: TPath, handler: RouteHandler<any>) {
    this.addRoute('PUT', path, handler);
    return this;
  }

  delete<TPath extends string>(path: TPath, handler: RouteHandler<any>) {
    this.addRoute('DELETE', path, handler);
    return this;
  }

  route(router: SuenoRouter) {
    // Merge the routes from the child router
    for (const [method, routes] of router.routes) {
      if (!this.routes.has(method)) {
        this.routes.set(method, new Map());
      }

      for (const [path, routeInfo] of routes) {
        // Create a wrapped handler that uses the child router's logger
        const wrappedHandler: RouteHandler = async (ctx: RouteContext) => {
          // Use the child router's logger
          const routerCtx = { ...ctx, logger: router.logger };
          return routeInfo.handler(routerCtx);
        };

        // Add the routes to this router's routes with the child router's logger
        this.routes.get(method)!.set(path, {
          ...routeInfo,
          handler: wrappedHandler,
          logger: router.logger, // Preserve the child router's logger
        });
      }
    }
    return this;
  }
}

export function createRouter(
  basePath: string = '',
  options: { name?: string; logLevel?: LogLevel } = {}
) {
  return new SuenoRouter(basePath, options);
}
