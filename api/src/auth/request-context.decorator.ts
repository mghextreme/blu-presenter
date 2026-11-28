import {
  createParamDecorator,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';
import { User } from 'src/entities';
import { OrganizationRoleOptions, RequestAuth } from 'src/types';

const getRequestAuth = (context: ExecutionContext): RequestAuth | undefined =>
  context.switchToHttp().getRequest<Request>().user as RequestAuth | undefined;

/** The signed-in user. Rejects the request when there is none. */
export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User => {
    const user = getRequestAuth(context)?.internal;
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  },
);

/** The signed-in user, or undefined on a `@Public()` route called anonymously. */
export const OptionalUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): User | undefined =>
    getRequestAuth(context)?.internal,
);

/** The organization from the `Organization` header, as checked by the guard on `@OrganizationRole` routes. */
export const OrgId = createParamDecorator(
  (_data: unknown, context: ExecutionContext): number => {
    const orgId = getRequestAuth(context)?.organization;
    if (orgId === undefined) {
      throw new ForbiddenException();
    }
    return orgId;
  },
);

/** The caller's role in `@OrgId()`, on `@OrganizationRole` routes. */
export const OrgRole = createParamDecorator(
  (_data: unknown, context: ExecutionContext): OrganizationRoleOptions => {
    const role = getRequestAuth(context)?.role;
    if (!role) {
      throw new ForbiddenException();
    }
    return role;
  },
);

/** The caller's Supabase access token, for calls made to Supabase on their behalf. */
export const AccessToken = createParamDecorator(
  (_data: unknown, context: ExecutionContext): string => {
    const authorization = context.switchToHttp().getRequest<Request>()
      .headers.authorization;
    const token = authorization?.replace(/^Bearer /, '');
    if (!token) {
      throw new UnauthorizedException();
    }
    return token;
  },
);
