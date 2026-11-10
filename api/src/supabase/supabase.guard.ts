import {
  CanActivate,
  ExecutionContext,
  Injectable,
  Scope,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UsersService, UsersBaseService } from '../users/users.service';
import {
  OrganizationsService,
  OrganizationsBaseService,
} from '../organizations/organizations.service';
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
    // WebSocket handlers must not go through the passport strategy: the WS
    // "request" is the socket itself and has no HTTP headers, so the JWT
    // extraction would always fail. Since NestJS v12 global guards run on
    // WS message handlers too, skip them here — WS gateways authenticate
    // through their own guards (see OptionalWebsocketGuard), mirroring
    // RestOnlyThrottlerGuard.
    if (context.getType() === 'ws') {
      return true;
    }

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

    // A client already tracked as joined to the session in the payload may
    // reuse that room without re-verification. leaveSession payloads carry
    // no orgId (it is already bound to the client); join payloads must match
    // it. Anything else is re-verified below via the token.
    const reusesJoinedSession =
      !!client.userId &&
      !!client.sessionId &&
      !!client.orgId &&
      data.sessionId === client.sessionId &&
      (data.orgId === undefined || data.orgId === client.orgId);
    if (reusesJoinedSession) {
      return true;
    }

    const token =
      data?.token ||
      client?.handshake?.auth?.token ||
      (client?.handshake?.query?.token as string);

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

    // leaveSession payloads omit orgId: fall back to the client's own org id
    // instead of querying the database with an undefined orgId.
    const orgId = data?.orgId ?? client?.orgId;
    if (orgId === undefined || orgId === null) {
      return false;
    }

    const session = await this.sessionService.findOne(orgId, data.sessionId);
    if (!session) {
      return false;
    }

    if (
      !(await this.organizationService.isFeatureEnabledInOrg(
        session.orgId,
        'sessions',
      ))
    ) {
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
