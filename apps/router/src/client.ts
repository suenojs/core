// Types to capture route definitions
import type { RouteContext } from './index';

type RouteParams<T extends string> = T extends `${infer Start}:${infer Param}/${infer Rest}`
  ? { [K in Param | keyof RouteParams<Rest>]: string }
  : T extends `${infer Start}:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, never>;

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

// Helper type to extract handler return type
type HandlerReturnType<T> = T extends (ctx: any) => Promise<infer R>
  ? R
  : T extends (ctx: any) => infer R
    ? R
    : never;

interface RouteInfo<T = any> {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler<any, T>;
}

type RouteHandler<TParams = Record<string, string>, TReturn = any> = (
  ctx: RouteContext<TParams>,
) => Promise<TReturn> | TReturn;

type ExtractRoutes<T> = T extends {
  routes: Map<string, Map<string, RouteInfo<any>>>;
}
  ? {
      [Method in HttpMethod]: {
        [Path in string]: Method extends keyof T['routes']
          ? Path extends keyof T['routes'][Method]
            ? T['routes'][Method][Path] extends RouteInfo<infer R>
              ? R
              : never
            : never
          : never;
      };
    }
  : never;

// API client types
interface ApiClientOptions {
  baseUrl: string;
  headers?: Record<string, string>;
}

type ApiResponse<T> = {
  data: T;
  status: number;
  headers: Headers;
};

class SuenoApiClient<TApp> {
  private baseUrl: string;
  private headers: Record<string, string>;
  private routes: ExtractRoutes<TApp>;

  constructor(options: ApiClientOptions, app: TApp) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '');
    this.headers = options.headers || {};
    this.routes = {} as ExtractRoutes<TApp>;
  }

  private async request<T = any>(
    method: HttpMethod,
    path: string & keyof ExtractRoutes<TApp>[typeof method],
    body?: any,
    params?: Record<string, string>,
  ): Promise<ApiResponse<T>> {
    let url = path;
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        url = url.replace(`:${key}`, encodeURIComponent(value));
      });
    }

    const response = await fetch(`${this.baseUrl}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...this.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });

    const contentType = response.headers.get('content-type');
    const data = contentType?.includes('application/json')
      ? await response.json().catch(() => null)
      : await response.text();

    return {
      data,
      status: response.status,
      headers: response.headers,
    };
  }

  get<TPath extends string & keyof ExtractRoutes<TApp>['GET']>(
    path: TPath,
    params?: RouteParams<TPath>,
  ): Promise<ApiResponse<ExtractRoutes<TApp>['GET'][TPath]>> {
    return this.request('GET', path, undefined, params);
  }

  post<TPath extends string & keyof ExtractRoutes<TApp>['POST'], TBody = any>(
    path: TPath,
    body: TBody,
    params?: RouteParams<TPath>,
  ): Promise<ApiResponse<ExtractRoutes<TApp>['POST'][TPath]>> {
    return this.request('POST', path, body, params);
  }

  put<TPath extends string & keyof ExtractRoutes<TApp>['PUT'], TBody = any>(
    path: TPath,
    body: TBody,
    params?: RouteParams<TPath>,
  ): Promise<ApiResponse<ExtractRoutes<TApp>['PUT'][TPath]>> {
    return this.request('PUT', path, body, params);
  }

  delete<TPath extends string & keyof ExtractRoutes<TApp>['DELETE']>(
    path: TPath,
    params?: RouteParams<TPath>,
  ): Promise<ApiResponse<ExtractRoutes<TApp>['DELETE'][TPath]>> {
    return this.request('DELETE', path, undefined, params);
  }
}

// Create API client factory
export function createSuenoApi<T>(options: ApiClientOptions, app: T): SuenoApiClient<T> {
  return new SuenoApiClient(options, app);
}

export type { ApiClientOptions, ApiResponse };
