import { CanActivate, ExecutionContext, Injectable, Scope } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { ORGANIZATION_ROLE_KEY } from '../auth/organization-role.decorator';
import { AuthenticatedSocket, isRoleHigherOrEqualThan } from 'src/types';
import { SessionsService } from 'src/sessions/sessions.service';
import { JwtService } from '@nestjs/jwt';

@Injectable({ scope: Scope.REQUEST })
export class SupabaseGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly userService: UsersService,
    private readonly organizationService: OrganizationsService,
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

    const defaultResponse = isPublic ? true : false;

    try {
      const result = (await super.canActivate(context)) as boolean;
      if (!result) {
        return defaultResponse;
      }
    } catch (e) {
      return defaultResponse;
    }

    const request = context.switchToHttp().getRequest();
    const internalUser = await this.userService.findByAuthId(request.user.sub);
    if (!internalUser) {
      return defaultResponse;
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
      return defaultResponse;
    }

    request['user']['organization'] = request.headers?.organization;
    const roleInOrganization = await this.organizationService.userRole(
      request.headers?.organization,
      internalUser.id,
    );
    request['user']['role'] = roleInOrganization;

    return allowedRoles.includes(roleInOrganization);
  }
}

export class WebsocketGuard implements CanActivate {
  constructor(
    protected readonly jwtService: JwtService,
    protected readonly userService: UsersService,
    protected readonly organizationService: OrganizationsService,
    protected readonly sessionService: SessionsService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    if (client.userId) {
      return true;
    }

    const data = context.switchToWs().getData();
    const token = 
      data?.token || 
      client.handshake.auth?.token || 
      client.handshake.query?.token as string;

    let authPayload;
    try {
      authPayload = await this.jwtService.verifyAsync(token);
    } catch (e) {
      return false;
    }

    const internalUser = await this.userService.findByAuthId(authPayload.sub);
    if (!internalUser) {
      return false;
    }

    const session = await this.sessionService.findOne(data.orgId, data.sessionId);
    if (!session) {
      return false;
    }

    const roleInOrganization = await this.organizationService.userRole(
      session.orgId,
      internalUser.id,
    );
    if (!isRoleHigherOrEqualThan(roleInOrganization, 'member')) {
      return false;
    }

    client.userId = internalUser.id;
    client.orgId = session.orgId;
    client.sessionId = session.id;
    return true;
  }
}

export class OptionalWebsocketGuard extends WebsocketGuard {

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    return true;
  }

}
