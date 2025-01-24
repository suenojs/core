import type { RouteContext } from './context';
import type { SuenoLogger } from '../logger';

export type RouteHandler<TPath extends string = string> = (
  ctx: RouteContext<TPath>
) => Promise<any> | any;

export interface RouteInfo {
  pattern: RegExp;
  paramNames: string[];
  handler: RouteHandler;
  logger: SuenoLogger;
  middleware?: any[];
}

export type SuenoRouteMap = Map<string, Map<string, RouteInfo>>;
