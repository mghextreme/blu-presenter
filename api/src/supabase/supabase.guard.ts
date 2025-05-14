import { ExecutionContext, Injectable, Scope } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { ORGANIZATION_ROLE_KEY } from '../auth/organization-role.decorator';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseGuard extends AuthGuard('jwt') {
  constructor(
    private reflector: Reflector,
    private userService: UsersService,
    private organizationService: OrganizationsService,
  ) {
    super();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const contextHandler = context.getHandler();
    const contextClass = context.getClass();
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      contextHandler,
      contextClass,
    ]);

    if (isPublic) {
      return true;
    }

    const result = (await super.canActivate(context)) as boolean;
    if (!result) {
      return false;
    }

    const request = context.switchToHttp().getRequest();
    const internalUser = await this.userService.findByAuthId(request.user.sub);
    if (!internalUser) {
      return false;
    }
    internalUser.email = request.user.email;
    request['user']['internal'] = internalUser;

    const allowedRoles = this.reflector.getAllAndOverride<string[]>(
      ORGANIZATION_ROLE_KEY,
      [contextHandler, contextClass],
    );
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    if (!request.headers?.organization) {
      return false;
    }

    const roleInOrganization = await this.organizationService.userRole(
      request.headers?.organization,
      internalUser.id,
    );
    request['user']['role'] = roleInOrganization;

    return allowedRoles.includes(roleInOrganization);
  }
}
