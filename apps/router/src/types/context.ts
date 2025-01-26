import type { TypedHeaders, RequestBody, HttpStatus, CommonHttpHeaderName } from './http';
import type { SuenoLogger } from '../logger';
import type { OpenAPIDocument } from './openapi';
import type { CacheContext } from './cache';
import type { HandlerContext, ExtractPathParams } from './route';

export interface BaseContext {
  request: Request;
  headers: TypedHeaders;
  body: RequestBody;
  query: URLSearchParams;
  params: Record<string, string>;
  logger: SuenoLogger;
  state: Record<string, any>;
  method: string;
  status: HttpStatus;
  path: string;
  openapi: OpenAPIDocument;
  cache: CacheContext['cache'];
  validatedBody: any;
  validatedQuery: any;
  validatedParams: any;
  setStatus(code: HttpStatus): this;
  setHeader(name: CommonHttpHeaderName | string, value: string): this;
  getHeader(name: CommonHttpHeaderName | string): string | null;
  hasHeader(name: CommonHttpHeaderName | string): boolean;
  json<T>(data: T): T;
  text(text: string): string;
}

export class BaseContextImpl<Path extends string = string> implements HandlerContext<Path> {
  public validatedBody: any = null;
  public validatedQuery: any = null;
  public validatedParams: any = null;

  constructor(
    public readonly request: Request,
    public readonly params: ExtractPathParams<Path>,
    public readonly body: RequestBody,
    public readonly logger: SuenoLogger,
    public state: Record<string, any>,
    public readonly method: string,
    public readonly headers: TypedHeaders,
    public status: HttpStatus,
    public readonly query: URLSearchParams,
    public readonly path: string,
    public openapi: OpenAPIDocument,
    public cache: CacheContext['cache'],
  ) {}

  setStatus(code: HttpStatus): this {
    this.status = code;
    return this;
  }

  setHeader(name: CommonHttpHeaderName | string, value: string): this {
    this.headers.set(name, value);
    return this;
  }

  getHeader(name: CommonHttpHeaderName | string): string | null {
    return this.headers.get(name);
  }

  hasHeader(name: CommonHttpHeaderName | string): boolean {
    return this.headers.has(name);
  }

  json<T>(data: T): T {
    this.headers.set('Content-Type', 'application/json');
    return data;
  }

  text(text: string): string {
    this.headers.set('Content-Type', 'text/plain');
    return text;
  }
}
