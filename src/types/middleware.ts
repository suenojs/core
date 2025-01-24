import type { BaseContext } from './context';

export type NextFunction = () => Promise<void> | void;
export type MiddlewareHandler = (ctx: BaseContext, next: NextFunction) => Promise<void> | void;
