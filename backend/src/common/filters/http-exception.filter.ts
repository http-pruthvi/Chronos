import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

interface HttpExceptionResponse {
  message?: string | string[];
  code?: string;
  details?: unknown;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: unknown = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody = exception.getResponse() as string | HttpExceptionResponse;

      if (typeof resBody === 'string') {
        message = resBody;
      } else if (typeof resBody === 'object' && resBody !== null) {
        const msg = resBody.message;
        message =
          typeof msg === 'string'
            ? msg
            : Array.isArray(msg)
              ? 'Validation failed'
              : exception.message;
        if (resBody.code) {
          code = resBody.code;
        } else {
          // Default code based on status
          if (status === HttpStatus.UNAUTHORIZED) {
            code = 'UNAUTHORIZED';
          } else if (status === HttpStatus.FORBIDDEN) {
            code = 'FORBIDDEN';
          } else if (status === HttpStatus.BAD_REQUEST) {
            code = 'BAD_REQUEST';
            if (Array.isArray(msg)) {
              details = { validationErrors: msg };
            }
          } else if (status === HttpStatus.NOT_FOUND) {
            code = 'NOT_FOUND';
          }
        }

        if (resBody.details) {
          details = resBody.details;
        }
      }
    } else {
      // Log generic errors
      console.error('Unhandled Exception:', exception);
      if (exception instanceof Error) {
        message = exception.message;
      }
      code = 'INTERNAL_SERVER_ERROR';
    }

    response.status(status).json({
      error: {
        code,
        message,
        ...(details ? { details } : {}),
      },
    });
  }
}
