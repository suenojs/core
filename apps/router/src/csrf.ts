import type { MiddlewareHandler, RouteContext } from './index';
import { createHash, randomBytes } from 'crypto';

interface CsrfOptions {
  cookie?: {
    key?: string;
    path?: string;
    maxAge?: number;
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'Strict' | 'Lax' | 'None';
  };
  ignoreMethods?: string[];
  tokenKey?: string;
}

const defaultOptions: CsrfOptions = {
  cookie: {
    key: 'csrf-token',
    path: '/',
    maxAge: 86400, // 24 hours
    httpOnly: true,
    secure: true,
    sameSite: 'Strict',
  },
  ignoreMethods: ['GET', 'HEAD', 'OPTIONS'],
  tokenKey: 'csrf-token',
};

function generateToken(secret: string): string {
  const salt = randomBytes(8).toString('hex');
  const hash = createHash('sha256')
    .update(salt + secret)
    .digest('hex');
  return `${salt}.${hash}`;
}

function validateToken(token: string, secret: string): boolean {
  const [salt, hash] = token.split('.');
  if (!salt || !hash) return false;

  const expectedHash = createHash('sha256')
    .update(salt + secret)
    .digest('hex');
  return hash === expectedHash;
}

export function csrf(options: CsrfOptions = {}): MiddlewareHandler {
  const csrfOptions = { ...defaultOptions, ...options };
  const { cookie, ignoreMethods, tokenKey } = csrfOptions;

  return async (ctx: RouteContext, next) => {
    // Skip CSRF check for ignored methods
    if (ignoreMethods!.includes(ctx.method)) {
      await next();
      return;
    }

    // Generate secret if not exists
    if (!ctx.state._csrfSecret) {
      ctx.state._csrfSecret = randomBytes(32).toString('hex');
    }

    // Get token from request header or cookie
    const token =
      ctx.headers.get(tokenKey!) ||
      ctx.headers
        .get('cookie')
        ?.match(new RegExp(`${cookie!.key}=([^;]+)`))
        ?.at(1);

    // For non-GET requests, validate the token
    if (!ignoreMethods!.includes(ctx.method)) {
      if (!token || !validateToken(token, ctx.state._csrfSecret)) {
        throw new Error('Invalid CSRF token');
      }
    }

    // Generate new token
    const newToken = generateToken(ctx.state._csrfSecret);

    // Set CSRF token cookie
    const cookieValue =
      `${cookie!.key}=${newToken}; Path=${cookie!.path}; Max-Age=${cookie!.maxAge}` +
      `${cookie!.httpOnly ? '; HttpOnly' : ''}${cookie!.secure ? '; Secure' : ''}; SameSite=${
        cookie!.sameSite
      }`;

    ctx.headers.set('Set-Cookie', cookieValue);
    ctx.headers.set(tokenKey!, newToken);

    await next();
  };
}
