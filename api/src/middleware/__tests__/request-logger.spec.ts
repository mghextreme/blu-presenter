import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import { requestLogger } from '../request-logger';

describe('requestLogger', () => {
  const logger = { log: jest.fn(), warn: jest.fn() };
  const middleware = requestLogger(logger as unknown as Logger);

  const handle = (
    request: Record<string, unknown>,
    statusCode: number,
  ): void => {
    const response = Object.assign(new EventEmitter(), { statusCode });
    const next = jest.fn();
    middleware(request as any, response as any, next);
    expect(next).toHaveBeenCalled();
    response.emit('finish');
  };

  beforeEach(() => jest.clearAllMocks());

  it('logs method, path, status and user, without the query string', () => {
    handle(
      {
        method: 'GET',
        originalUrl: '/songs/7?secret=topsecret',
        user: { internal: { id: 3 } },
      },
      200,
    );

    const line: string = logger.log.mock.calls[0][0];
    expect(line).toMatch(/^GET \/songs\/7 200 \d+ms user=3$/);
    expect(line).not.toContain('topsecret');
  });

  it('logs failed requests as warnings', () => {
    handle({ method: 'POST', originalUrl: '/songs' }, 403);

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringMatching(/^POST \/songs 403 \d+ms$/),
    );
  });

  it('skips successful health checks', () => {
    handle({ method: 'GET', originalUrl: '/' }, 200);

    expect(logger.log).not.toHaveBeenCalled();
  });
});
