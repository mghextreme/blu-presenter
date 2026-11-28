import {
  BadRequestException,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { Request } from 'express';
import { IS_PUBLIC_KEY } from './public.decorator';
import { UsersService } from '../users/users.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { ORGANIZATION_ROLE_KEY } from '../auth/organization-role.decorator';
import { OrganizationRoleOptions, RequestAuth } from 'src/types';

@Injectable()
export class SupabaseGuard extends AuthGuard('jwt') {
  constructor(
    private readonly reflector: Reflector,
    private readonly usersService: UsersService,
    private readonly organizationsService: OrganizationsService,
  ) {
    super();
  }

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    // Since NestJS v12 global guards also run on WS message handlers, where
    // the "request" is the socket and has no HTTP headers. Sessions are
    // joined by secret, so WS handlers are not authenticated here.
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
    } catch {
      if (isPublic) return true;
      throw new UnauthorizedException();
    }

    const request = context.switchToHttp().getRequest<Request>();
    const auth = request.user as RequestAuth;
    const internalUser = await this.usersService.findByAuthId(auth.sub);
    if (!internalUser) {
      if (isPublic) return true;
      throw new UnauthorizedException();
    }
    if (auth.email !== undefined) {
      internalUser.email = auth.email;
    }
    auth.internal = internalUser;

    const allowedRoles = this.reflector.getAllAndOverride<
      OrganizationRoleOptions[]
    >(ORGANIZATION_ROLE_KEY, [contextHandler, contextClass]);
    if (!allowedRoles || allowedRoles.length === 0) {
      return true;
    }

    const orgId = parseOrganizationHeader(request.headers.organization);
    if (orgId === undefined) {
      return false;
    }

    const role = await this.organizationsService.userRole(
      orgId,
      internalUser.id,
    );
    if (!role || !allowedRoles.includes(role)) {
      return false;
    }

    auth.organization = orgId;
    auth.role = role;
    return true;
  }
}

/** Undefined when the header is missing; rejects a malformed one. */
function parseOrganizationHeader(
  header: string | string[] | undefined,
): number | undefined {
  if (header === undefined || header === '') {
    return undefined;
  }
  const orgId = Number(header);
  if (!Number.isSafeInteger(orgId) || orgId < 1) {
    throw new BadRequestException('Invalid Organization header');
  }
  return orgId;
}
