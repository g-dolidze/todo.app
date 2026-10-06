import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { ApiErrorBody } from '@progress/shared';
import { ZodError } from 'zod';
import { AppError } from '../lib/errors';

export const notFound: RequestHandler = (req, _res, next) => {
  next(new AppError('NOT_FOUND', `Route ${req.method} ${req.path} not found`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let error: AppError;
  if (err instanceof AppError) {
    error = err;
  } else if (err instanceof ZodError) {
    error = new AppError('VALIDATION_ERROR', 'Request validation failed', err.flatten());
  } else if (err?.type === 'entity.parse.failed') {
    error = new AppError('VALIDATION_ERROR', 'Malformed JSON body');
  } else {
    if (process.env.NODE_ENV !== 'test') console.error(err);
    error = new AppError('INTERNAL_ERROR', 'Something went wrong');
  }

  const body: ApiErrorBody = {
    error: {
      code: error.code,
      message: error.message,
      ...(error.details === undefined ? {} : { details: error.details }),
    },
  };
  res.status(error.status).json(body);
};
