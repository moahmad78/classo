import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { logger } from '../logging/structured-logger.service.js';

/**
 * PRD Section 13: Standardized Error Shape
 * { "error": { "code": "...", "message": "...", "details": [...] } }
 */
@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let code = 'INTERNAL_SERVER_ERROR';
    let message = 'Kuch gadbad ho gayi. Dobara try karein, na chale to hume batayein.';
    let details: unknown[] = [];

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();

      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const obj = res as Record<string, any>;
        code = obj.code || code;
        message = obj.message || message;
        details = Array.isArray(obj.message) ? obj.message : obj.details || [];
      }
    } else if (exception instanceof Error) {
      logger.error('Unhandled Exception caught by ApiExceptionFilter', exception);
    }

    response.status(status).json({
      error: {
        code,
        message,
        details,
      },
    });
  }
}
