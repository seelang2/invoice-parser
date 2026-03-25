import { str } from 'ajv'
import type { ErrorRequestHandler, Request, Response, NextFunction } from 'express'
//import { ZodError } from 'zod'

// Route 404 needs separate handler to prevent builtin route 404 handler
export function notFoundHandler(req: Request, _res: Response, next: NextFunction) {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
}

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  /** true = expected failure; false = bug — crash the process */
  public readonly isOperational: boolean;
  public readonly details?: unknown;

  constructor(
    message: string,
    statusCode: number,
    code: string,
    options: { isOperational?: boolean; details?: unknown; cause?: unknown } = {}
  ) {
    super(message, { cause: options.cause });
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = options.isOperational ?? true;
    this.details = options.details;
    // Fix prototype chain — required when extending built-ins in TS
    Object.setPrototypeOf(this, new.target.prototype);
    Error.captureStackTrace(this, this.constructor);
  }

  className() { return this.constructor.name }
}


// 400 — client sent bad data
export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR', { details });
  }
}

// 404 — resource not found
export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

// 422 - Unprocessable Content: Not an invoice
/*
{
  "success": false,
  "error": "NOT_AN_INVOICE",
  "message": "Image does not appear to contain an invoice"
}
*/
export class NotInvoiceError extends AppError {
  constructor(message = 'Image does not appear to contain an invoice') {
    super(message, 422, 'NOT_AN_INVOICE')
  }
}

// 422 - Unprocessable Content : Low confidence
/*
{
  "success": false,
  "error": "LOW_CONFIDENCE",
  "confidence": 0.45,  // Below threshold
  "message": "Image quality too low for reliable extraction",
  "suggestions": ["Upload a higher resolution image", "Ensure good lighting"]
}
*/
export class LowConfidenceError extends AppError {
  constructor(message: string, details?: unknown) {
    // const out = {...stuff as object, ...{param1: 'extra', param2: 'properties'}}
    const allDetails = { ...details as object, ...{ suggestions: ["Upload a higher resolution image", "Ensure good lighting"], ...{} } }
    super(`Image quality too low for reliable extraction`, 422, 'LOW_CONFIDENCE', allDetails as any)
  }
}

// 422 - Unprocessable Content: Multiple invoices in image
/*
{
  "success": false,
  "error": "MULTIPLE_INVOICES_DETECTED",
  "message": "Please upload one invoice per image",
  "invoicesDetected": 2
}
*/
export class MultipleInvoicesError extends AppError {
  constructor(message = "Please upload one invoice per image.", details?: unknown) {
    super(message, 422, 'MULTIPLE_INVOICES_DETECTED', details || {})
  }
}

// 503 Service Unavailable: API timeout (non-fatal)
export class ServiceUnavailableError extends AppError {
  constructor(message = 'The requested service is temporarily unavailable.') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}


export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  // Headers already sent — can't write a new response
  if (res.headersSent) {
    // logger.warn({ err }, 'Error after headers sent');
    console.log(err, 'Error after headers sent')
    return;
  }

  let appErr: AppError;

  if (err instanceof AppError) {
    console.log(`AppError: ${err.className()}`)
    appErr = err;
  } else if (err.requestID && err.error) {
    console.log('Anthropic API error wrapper')
    // Anthropic API error wrapper
    appErr = new AppError(
      'An unexpected error occurred', 500, 'INTERNAL_ERROR', 
      { 
        isOperational: false,
        details: { source: 'Anthropic API', requestID: err.requestID, status: err.status, type: err.error.error.type },
        cause: err.error.error.message
      }
    );
  } else if (err instanceof Error) {
    console.log('Unknown error from a third-party lib')
    // Unknown error from a third-party lib — treat as 500
    appErr = new AppError(
      'An unexpected error occurred', 500, 'INTERNAL_ERROR',
      { isOperational: false, cause: err }
    );
  } else {
    console.log('Other error')
    // Thrown non-Error (e.g. throw 'oops') — always a bug
    appErr = new AppError(
      'An unexpected error occurred', 500, 'INTERNAL_ERROR',
      { isOperational: false }
    );
  }

  // Logging - just using console.log for this app; use actual logger like Pino
  const logPayload = {
    err: appErr,
    // requestId: ctx?.requestId,
    method: req.method,
    path: req.path,
    statusCode: appErr.statusCode,
    code: appErr.code,
    details: appErr.details
  };

  if (appErr.statusCode >= 500) {
    // logger.error(logPayload, appErr.message);
    console.error(logPayload, appErr.message)
  } else if (appErr.statusCode >= 400) {
    // logger.warn(logPayload, appErr.message);
    console.log(logPayload, appErr.message)
  }

  const isProd = process.env.NODE_ENV === 'production';

  // Apps should adopt RFC 9457 for error responses
  // Spec for this project has custom JSON response so we adhere to it (mostly, but standardized)
  res.status(appErr.statusCode).json({
    requestId: res.locals.requestId,
    success: false,
    error: appErr.code,
    message: appErr.message,
    details: isProd && !appErr.isOperational ? undefined : appErr.details
  })

  // Non-operational errors should stop the app
  if (!appErr.isOperational) {
    // Give the response time to flush, then exit
    setImmediate(() => {
      // logger.fatal({ err: appErr }, 'Programmer error — shutting down');
      console.log({ err: appErr }, 'Programmer error — shutting down')
      process.emit('SIGTERM'); // Initiate graceful shutdown
    });
  }

  /*
  res.status(appErr.statusCode).json({
    type:     `https://errors.yourdomain.com/${appErr.code.toLowerCase()}`,
    title:    appErr.message,
    status:   appErr.statusCode,
    detail:   appErr.isOperational && !isProd ? appErr.message : undefined,
    instance: req.path,
    code:     appErr.code,
    requestId: res.locals.requestId,
    // Only expose structured details for operational errors (never for 5xx bugs)
    ...(appErr.isOperational && appErr.details
      ? { errors: appErr.details }
      : {}),
  });
  */

}

/*
Anthropic Error (JSON) message:
{
    "status": 400,
    "headers": {},
    "requestID": "req_011CZNozGXDucETk7Chv7CuP",
    "error": {
        "type": "error",
        "error": {
            "type": "invalid_request_error",
            "message": "output_config.format.schema: For 'object' type, 'additionalProperties' must be explicitly set to false"
        },
        "request_id": "req_011CZNozGXDucETk7Chv7CuP"
    }
}
*/
