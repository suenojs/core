import type {
  TypedHeaders,
  RequestBody,
  ExtractParams,
  HttpStatus,
  CommonHttpHeaderName,
} from './http';
import type { SuenoLogger } from '../logger';

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
}

export type RouteContext<TPath extends string = string> = BaseContext & {
  params: ExtractParams<TPath>;
};

export class BaseContextImpl implements BaseContext {
  constructor(
    public readonly request: Request,
    public readonly params: Record<string, string>,
    public readonly body: RequestBody,
    public readonly logger: SuenoLogger,
    public state: Record<string, any>,
    public readonly method: string,
    public readonly headers: TypedHeaders,
    public status: HttpStatus,
    public readonly query: URLSearchParams
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
