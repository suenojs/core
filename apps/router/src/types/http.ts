// Common HTTP Status Codes
export const enum HttpStatus {
  // 2xx Success
  OK = 200,
  CREATED = 201,
  ACCEPTED = 202,
  NO_CONTENT = 204,

  // 3xx Redirection
  MOVED_PERMANENTLY = 301,
  FOUND = 302,
  SEE_OTHER = 303,
  NOT_MODIFIED = 304,
  TEMPORARY_REDIRECT = 307,
  PERMANENT_REDIRECT = 308,

  // 4xx Client Errors
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  METHOD_NOT_ALLOWED = 405,
  NOT_ACCEPTABLE = 406,
  CONFLICT = 409,
  GONE = 410,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,

  // 5xx Server Errors
  INTERNAL_SERVER_ERROR = 500,
  NOT_IMPLEMENTED = 501,
  BAD_GATEWAY = 502,
  SERVICE_UNAVAILABLE = 503,
  GATEWAY_TIMEOUT = 504,
}

export type CommonHttpHeaderName =
  | 'Accept'
  | 'Accept-Charset'
  | 'Accept-Encoding'
  | 'Accept-Language'
  | 'Authorization'
  | 'Cache-Control'
  | 'Content-Length'
  | 'Content-Type'
  | 'Cookie'
  | 'Date'
  | 'ETag'
  | 'Host'
  | 'If-Match'
  | 'If-Modified-Since'
  | 'If-None-Match'
  | 'If-Range'
  | 'If-Unmodified-Since'
  | 'Origin'
  | 'Pragma'
  | 'Referer'
  | 'User-Agent'
  | 'X-Forwarded-For'
  | 'X-Forwarded-Host'
  | 'X-Forwarded-Proto'
  | 'X-Real-IP'
  | 'X-Request-ID'
  | 'X-CSRF-Token';

export interface TypedHeaders {
  get(name: CommonHttpHeaderName | string): string | null;
  set(name: CommonHttpHeaderName | string, value: string): void;
  append(name: CommonHttpHeaderName | string, value: string): void;
  delete(name: CommonHttpHeaderName | string): void;
  has(name: CommonHttpHeaderName | string): boolean;
}

export interface RequestBody {
  /**
   * Parse the request body as JSON
   */
  json<T = any>(): Promise<T>;
}

export interface SSLOptions {
  key: string;
  cert: string;
}

export interface ServeOptions {
  port?: number;
  hostname?: string;
  development?: boolean;
  ssl?: SSLOptions;
}

export interface CorsOptions {
  origin?: string | string[];
  methods?: string[];
}

// Extract URL parameters from path pattern
export type ExtractParams<T> = T extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param]: string } & ExtractParams<Rest>
  : T extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, never>;
