import { z } from 'zod';
import type { MiddlewareHandler } from '../types/middleware';
import type { OpenAPIMiddleware, OpenAPIMetadata, OpenAPIDocument } from '../types/openapi';
import { HttpStatus } from '../types/http';

// Type helper to extract type from Zod schema
type InferZodType<T extends z.ZodType> = z.infer<T>;

// Extend the BaseContext to include typed request data
declare module '../types/context' {
  interface BaseContext {
    validatedBody: any;
    validatedQuery: any;
    validatedParams: any;
  }
}

interface RequestValidationOptions<
  B extends z.ZodType | undefined = undefined,
  Q extends z.ZodType | undefined = undefined,
  P extends z.ZodType | undefined = undefined
> {
  body?: B;
  query?: Q;
  params?: P;
  description?: string;
}

type ValidatedContext<
  B extends z.ZodType | undefined,
  Q extends z.ZodType | undefined,
  P extends z.ZodType | undefined
> = {
  validatedBody: B extends z.ZodType ? z.infer<B> : null;
  validatedQuery: Q extends z.ZodType ? z.infer<Q> : null;
  validatedParams: P extends z.ZodType ? z.infer<P> : null;
};

export function request<
  B extends z.ZodType | undefined = undefined,
  Q extends z.ZodType | undefined = undefined,
  P extends z.ZodType | undefined = undefined
>(options: RequestValidationOptions<B, Q, P>): OpenAPIMiddleware {
  const middleware: OpenAPIMiddleware = async (ctx, next) => {
    const validationErrors: string[] = [];

    try {
      // Validate body if schema provided
      if (options.body) {
        const body = await ctx.body.json();
        ctx.validatedBody = await options.body.parseAsync(body);
      }

      // Validate query if schema provided
      if (options.query) {
        const queryObj = Object.fromEntries(ctx.query.entries());
        ctx.validatedQuery = await options.query.parseAsync(queryObj);
      }

      // Validate params if schema provided
      if (options.params) {
        ctx.validatedParams = await options.params.parseAsync(ctx.params);
      }

      await next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        error.errors.forEach((err) => {
          validationErrors.push(`${err.path.join('.')}: ${err.message}`);
        });
        ctx.status = HttpStatus.BAD_REQUEST;
        return ctx.json({ errors: validationErrors });
      }
      throw error;
    }
  };

  middleware._openapi = {
    requestBody: options.body
      ? {
          schema: options.body,
          description: options.description,
        }
      : undefined,
    responses: {
      [HttpStatus.BAD_REQUEST]: {
        schema: z.object({
          errors: z.array(z.string()),
        }),
        description: 'Validation failed',
      },
    },
    tags: [],
  };

  return middleware;
}

export function response(
  statusCode: number | HttpStatus,
  schema: z.ZodType,
  description?: string
): OpenAPIMiddleware {
  const middleware: OpenAPIMiddleware = async (ctx, next) => {
    await next();
  };

  middleware._openapi = {
    responses: {
      [statusCode]: {
        schema,
        description,
      },
    },
    tags: [],
  };

  return middleware;
}

export interface OpenAPIOptions {
  title: string;
  version: string;
  description?: string;
}

export function openapi(options: OpenAPIOptions): MiddlewareHandler {
  const document: OpenAPIDocument = {
    openapi: '3.0.0',
    info: {
      title: options.title,
      version: options.version,
      description: options.description,
    },
    paths: {},
    components: {
      schemas: {},
    },
  };

  return async (ctx, next) => {
    // Store OpenAPI document in context
    ctx.openapi = document;

    // If this is a request for the OpenAPI document
    if (ctx.path === '/openapi.json' && ctx.method === 'GET') {
      return ctx.json(document);
    }

    // Collect route information from middleware chain
    const middlewares = ctx.state._middlewares || [];
    const routePath = ctx.state._routePath || ctx.path;

    if (!document.paths[routePath]) {
      document.paths[routePath] = {};
    }

    const pathItem = document.paths[routePath];
    const method = ctx.method.toLowerCase();

    // Collect OpenAPI metadata from middleware chain
    const metadata: OpenAPIMetadata = {
      responses: {},
      tags: [] as string[],
    };

    for (const middleware of middlewares) {
      if (middleware._openapi) {
        if (middleware._openapi.requestBody) {
          metadata.requestBody = middleware._openapi.requestBody;
        }
        if (middleware._openapi.responses) {
          Object.assign(metadata.responses, middleware._openapi.responses);
        }
        if (middleware._openapi.tags) {
          metadata.tags.push(...middleware._openapi.tags);
        }
      }
    }

    // Add collected metadata to OpenAPI document
    pathItem[method] = {
      ...(metadata.tags.length > 0 && { tags: metadata.tags }),
      ...(metadata.requestBody && {
        requestBody: {
          content: {
            'application/json': {
              schema: metadata.requestBody.schema,
            },
          },
          description: metadata.requestBody.description,
        },
      }),
      responses: Object.entries(metadata.responses).reduce((acc, [status, response]) => {
        acc[status] = {
          description: response.description || 'No description provided',
          content: {
            'application/json': {
              schema: response.schema,
            },
          },
        };
        return acc;
      }, {} as Record<string, any>),
    };

    await next();
  };
}

// Helper function to set tags for a route
export function withTags(...tags: string[]): OpenAPIMiddleware {
  const middleware: OpenAPIMiddleware = async (ctx, next) => {
    await next();
  };

  middleware._openapi = {
    responses: {},
    tags,
  };

  return middleware;
}
