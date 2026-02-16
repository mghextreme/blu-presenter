import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

/**
 * Throttler guard that only applies to HTTP (REST) contexts.
 * WebSocket handlers are skipped entirely since they have their own
 * guards and the default ThrottlerGuard crashes on WS contexts
 * when trying to access HTTP request/response objects.
 */
@Injectable()
export class RestOnlyThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(context: ExecutionContext): Promise<boolean> {
    if (context.getType() === 'ws') {
      return true;
    }
    return super.shouldSkip(context);
  }
}
