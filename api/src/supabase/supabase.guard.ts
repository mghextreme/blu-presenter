import { ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class SupabaseGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private userService: UsersService,
  ) {
    super();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const result = (await super.canActivate(context)) as boolean;

    const request = context.switchToHttp().getRequest();
    const internalUser = await this.userService.findOne(request.user.sub);
    request['user']['internal'] = internalUser;

    return result;
  }
}
