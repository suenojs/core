import type { MiddlewareHandler, RouteContext } from './index';

interface CorsOptions {
  origin?: string | string[] | boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  credentials?: boolean;
  maxAge?: number;
}

const defaultOptions: CorsOptions = {
  origin: '*',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  allowedHeaders: [],
  exposedHeaders: [],
  credentials: false,
  maxAge: 86400, // 24 hours
};

function isOriginAllowed(origin: string, allowedOrigin: string | string[] | boolean): boolean {
  if (allowedOrigin === '*' || allowedOrigin === true) {
    return true;
  }

  if (Array.isArray(allowedOrigin)) {
    return allowedOrigin.includes(origin);
  }

  return origin === allowedOrigin;
}

export function cors(options: CorsOptions = {}): MiddlewareHandler {
  const corsOptions: CorsOptions = { ...defaultOptions, ...options };

  return async (ctx: RouteContext, next) => {
    const origin = ctx.headers.get('origin');

    // Handle preflight requests
    if (ctx.method === 'OPTIONS') {
      if (corsOptions.methods) {
        ctx.headers.set('Access-Control-Allow-Methods', corsOptions.methods.join(', '));
      }

      if (corsOptions.allowedHeaders && corsOptions.allowedHeaders.length > 0) {
        ctx.headers.set('Access-Control-Allow-Headers', corsOptions.allowedHeaders.join(', '));
      } else {
        const requestHeaders = ctx.headers.get('access-control-request-headers');
        if (requestHeaders) {
          ctx.headers.set('Access-Control-Allow-Headers', requestHeaders);
        }
      }

      if (corsOptions.maxAge) {
        ctx.headers.set('Access-Control-Max-Age', corsOptions.maxAge.toString());
      }
    }

    // Set exposed headers
    if (corsOptions.exposedHeaders && corsOptions.exposedHeaders.length > 0) {
      ctx.headers.set('Access-Control-Expose-Headers', corsOptions.exposedHeaders.join(', '));
    }

    // Handle origin
    if (origin && corsOptions.origin) {
      if (isOriginAllowed(origin, corsOptions.origin)) {
        ctx.headers.set('Access-Control-Allow-Origin', origin);
      }
    }

    // Handle credentials
    if (corsOptions.credentials) {
      ctx.headers.set('Access-Control-Allow-Credentials', 'true');
    }

    // For preflight requests, return early
    if (ctx.method === 'OPTIONS') {
      ctx.status = 204;
      return;
    }

    // For actual requests, continue with the next middleware/route handler
    await next();
  };
}
