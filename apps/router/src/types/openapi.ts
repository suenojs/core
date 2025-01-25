import { z } from 'zod';
import type { MiddlewareHandler } from './middleware';

export interface OpenAPIMetadata {
  requestBody?: {
    schema: z.ZodType;
    description?: string;
  };
  responses: {
    [statusCode: number]: {
      schema: z.ZodType;
      description?: string;
    };
  };
  tags: string[];
}

export interface OpenAPIDocument {
  openapi: string;
  info: {
    title: string;
    version: string;
    description?: string;
  };
  paths: Record<string, any>;
  components: {
    schemas: Record<string, any>;
  };
}

export interface OpenAPIContext {
  openapi: OpenAPIDocument;
}

// Extend BaseContext with OpenAPI methods
declare module './context' {
  interface BaseContext extends OpenAPIContext {}
}

export type OpenAPIMiddleware = MiddlewareHandler & {
  _openapi?: OpenAPIMetadata;
};
