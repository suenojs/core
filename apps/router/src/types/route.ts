import type { BaseContext } from './context';
import type { SuenoLogger } from '../logger';
import type { MiddlewareHandler, RouteMiddlewareHandler } from './middleware';

// Helper type to extract path parameters
export type ExtractPathParams<T extends string> = T extends `${string}:${infer Param}/${infer Rest}`
  ? { [K in Param]: string } & ExtractPathParams<Rest>
  : T extends `${string}:${infer Param}`
    ? { [K in Param]: string }
    : Record<string, string>;

// Handler context type
export type HandlerContext<Path extends string> = BaseContext & {
  params: ExtractPathParams<Path>;
};

// Route handler type that infers path parameters from the path string
export type RouteHandler<Path extends string = string> = (
  ctx: HandlerContext<Path>,
) => Promise<any> | any;

export interface RouteInfo<Path extends string = string> {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler<Path>;
  logger: SuenoLogger;
  middleware?: Array<MiddlewareHandler | RouteMiddlewareHandler<Path>>;
}

export type SuenoRouteMap = Map<string, Map<string, RouteInfo>>;
