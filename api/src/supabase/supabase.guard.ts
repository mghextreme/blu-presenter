import { CanActivate, ExecutionContext, Injectable, Scope, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UsersService, UsersBaseService } from '../users/users.service';
import { OrganizationsService, OrganizationsBaseService } from '../organizations/organizations.service';
import { ORGANIZATION_ROLE_KEY } from '../auth/organization-role.decorator';
import { AuthenticatedSocket, isRoleHigherOrEqualThan } from 'src/types';
import { SessionsService } from 'src/sessions/sessions.service';
import { JwtVerificationService } from './jwt-verification.service';

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

    try {
      const result = (await super.canActivate(context)) as boolean;
      if (!result) {
        if (isPublic) return true;
        throw new UnauthorizedException();
      }
    } catch (e) {
      if (isPublic) return true;
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest();
    const internalUser = await this.userService.findByAuthId(request.user.sub);
    if (!internalUser) {
      if (isPublic) return true;
      throw new UnauthorizedException();
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

    request['user']['organization'] = request.headers?.organization;
    const roleInOrganization = await this.organizationService.userRole(
      request.headers?.organization,
      internalUser.id,
    );
    request['user']['role'] = roleInOrganization;

    return allowedRoles.includes(roleInOrganization);
  }
}

@Injectable()
export class WebsocketGuard implements CanActivate {
  constructor(
    protected readonly jwtVerificationService: JwtVerificationService,
    protected readonly userService: UsersBaseService,
    protected readonly organizationService: OrganizationsBaseService,
    protected readonly sessionService: SessionsService,
  ) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const client: AuthenticatedSocket = context.switchToWs().getClient();
    const data = context.switchToWs().getData();

    if (!!client.userId && !!client.orgId && !!client.sessionId) {
      if (!data.sessionId || (data.sessionId === client.sessionId && data.orgId === client.orgId)) {
        return true;
      }
    }

    const token = 
      data?.token || 
      client.handshake.auth?.token || 
      client.handshake.query?.token as string;

    let authPayload;
    try {
      authPayload = await this.jwtVerificationService.verifyToken(token);
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

@Injectable()
export class OptionalWebsocketGuard extends WebsocketGuard {

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    await super.canActivate(context);
    return true;
  }

}
