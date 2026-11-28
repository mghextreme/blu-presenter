import type { User } from 'src/entities';
import type { OrganizationRoleOptions } from './organization-role.type';

/**
 * What `request.user` holds on an authenticated request: the verified JWT
 * payload, plus what `SupabaseGuard` adds. Read it through the param
 * decorators in `src/auth/request-context.decorator.ts`.
 */
export interface RequestAuth {
  sub: string;
  email?: string;
  internal?: User;
  /** Set on `@OrganizationRole` routes only. */
  organization?: number;
  /** Set on `@OrganizationRole` routes only. */
  role?: OrganizationRoleOptions;
}
