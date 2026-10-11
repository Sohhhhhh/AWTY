import { ZodError } from 'zod';
import { NextFunction, Request, Response } from 'express';

import env from '../config/env';
import APIError from '../utils/api-error';
import { STATUS_CODES } from '../utils/status-codes';
import { RequestValidationError } from 'zod-express-validator';

const sendErrorDev = (err: APIError, res: Response) => {
  res.status(err.statusCode).json({
    error: err,
    stack: err.stack,
    message: err.message,
    statusCode: err.statusCode,
    ...(err.issues && { issues: err.issues }),
  });
};

const sendErrorProd = (err: APIError, res: Response) => {
  if (err.isOperational)
    return res.status(err.statusCode).json({
      statusCode: err.statusCode,
      message: err.message,
      ...(err.issues && { issues: err.issues }),
    });

  return res.status(STATUS_CODES.InternalServerError).json({
    statusCode: STATUS_CODES.InternalServerError,
    message: 'Something went wrong, Please try again later.',
  });
};

export default (
  err: APIError,
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // Convert known errors to APIError
  let error = convertToAPIError(err);
  error.statusCode = error.statusCode || 500;

  if (env.NODE_ENV === 'development') sendErrorDev(error, res);
  if (env.NODE_ENV === 'production') sendErrorProd(error, res);
};

// --- Helpers ---

// handle Zod validation errors
const handleZodError = (err: ZodError): APIError => {
  const message = err.issues
    .map((e) => `${e.path.join('.')}: ${e.message}`)
    .join(', ');
  return new APIError(`Validation error: ${message}`, STATUS_CODES.BadRequest);
};

const handleRequestValidationError = (
  err: RequestValidationError,
): APIError => {
  const { bodyError, paramsError, queryError } = err.errors;
  const zodError = bodyError ?? paramsError ?? queryError;

  return zodError
    ? handleZodError(zodError)
    : new APIError('Validation error', STATUS_CODES.BadRequest);
};

const internalError = (message: string): APIError => {
  const error = new APIError(message, STATUS_CODES.InternalServerError);
  error.isOperational = false;
  return error;
};

const convertToAPIError = (err: unknown): APIError => {
  const unwrapped = (err as any)?.cause ?? err;

  if (unwrapped instanceof RequestValidationError)
    return handleRequestValidationError(unwrapped);
  if (unwrapped instanceof ZodError || (unwrapped as any)?.name === 'ZodError')
    return handleZodError(unwrapped as ZodError);
  else if (unwrapped instanceof APIError) return unwrapped;
  else if (unwrapped instanceof Error) return internalError(unwrapped.message);
  else return internalError('Unknown error');
};
