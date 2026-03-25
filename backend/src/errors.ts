import { str } from 'ajv'
import type { ErrorRequestHandler } from 'express'
//import { ZodError } from 'zod'

class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string
  ) { super(message) }
}

export class NotFoundError     extends AppError { constructor(m = 'Not found')     { super(404, 'NOT_FOUND', m) } }
export class UnauthorizedError extends AppError { constructor(m = 'Unauthorized')  { super(401, 'UNAUTHORIZED', m) } }
export class ForbiddenError    extends AppError { constructor(m = 'Forbidden')     { super(403, 'FORBIDDEN', m) } }
export class ConflictError     extends AppError { constructor(m = 'Conflict')      { super(409, 'CONFLICT', m) } }
export class ValidationError   extends AppError { constructor(m = 'Invalid input') { super(422, 'VALIDATION_ERROR', m) } }

export class ParseError        extends AppError { constructor(m = 'Parsing Error')     { super(400, 'PARSE_ERROR', m) } }

/*
{
  "success": false,
  "error": "NOT_AN_INVOICE",
  "message": "Image does not appear to contain an invoice"
}
*/

/*

Anthropic Error (JSON) message
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



export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {

    // console.dir(err)

//   if (err instanceof ZodError) {
//     return res.status(422).json({
//       code:   'VALIDATION_ERROR',
//       errors: err.flatten()
//     })
//   }
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      code:    err.code,
      message: err.message
    })
  }

  // Anthropic API error
  if (err.requestID && err.error) {
    console.log({requestID: err.requestID, status: err.status, type: err.error.error.type, message: err.error.error.message})

    return res.status(err.status).json({
        "success": false,
        "error": err.error.error.type,
        "message": err.error.error.message
    })

  }
    
  //logger.error({ err, requestId: req.id }, 'Unhandled error')
  console.log('Unhandled error:')
  console.dir(err)
  res.status(500).json({
    success: false,
    error: "INTERNAL_ERROR",
    message: "An internal error occurred. Please try again later."
    })
}
