import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let code = 'INTERNAL_SERVER_ERROR';
    let details: any = null;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const resBody: any = exception.getResponse();
      
      if (typeof resBody === 'string') {
        message = resBody;
      } else if (typeof resBody === 'object' && resBody !== null) {
        message = resBody.message || exception.message;
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
            if (Array.isArray(resBody.message)) {
              details = { validationErrors: resBody.message };
              message = 'Validation failed';
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
      message = exception.message || message;
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
