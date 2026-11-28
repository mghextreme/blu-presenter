import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { RequestAuth } from 'src/types';

/**
 * Logs one line per HTTP request once it is answered. The query string is
 * left out because share secrets travel in it.
 */
export function requestLogger(logger = new Logger('HTTP')) {
  return (request: Request, response: Response, next: NextFunction): void => {
    const startedAt = performance.now();

    response.on('finish', () => {
      const path = request.originalUrl.split('?')[0];
      const { statusCode } = response;
      // The load balancer's health check would drown everything else.
      if (path === '/' && statusCode < 400) {
        return;
      }

      const durationMs = Math.round(performance.now() - startedAt);
      const userId = (request.user as RequestAuth | undefined)?.internal?.id;
      const line = `${request.method} ${path} ${statusCode} ${durationMs}ms${
        userId === undefined ? '' : ` user=${userId}`
      }`;

      if (statusCode >= 400) {
        logger.warn(line);
      } else {
        logger.log(line);
      }
    });

    next();
  };
}
