import type { RequestHandler } from 'express';
import type { z } from 'zod';

/** Replaces req.body with the parsed value. Errors go to the error handler as VALIDATION_ERROR. */
export function validateBody(schema: z.ZodType): RequestHandler {
  return (req, _res, next) => {
    req.body = schema.parse(req.body ?? {});
    next();
  };
}
