import type { BaseContext, RouteContext } from './context';

export type NextFunction = () => Promise<void> | void;
export type MiddlewareHandler = (ctx: BaseContext, next: NextFunction) => Promise<void> | void;
export type RouteMiddlewareHandler<TPath extends string = string> = (
  ctx: RouteContext<TPath>,
  next: NextFunction,
) => Promise<void> | void;
