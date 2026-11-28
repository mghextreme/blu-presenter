import { Session, User } from '@supabase/supabase-js';

export class AccessTokenDto {
  /** Null when Supabase returns no user or session (e.g. sign-up awaiting email confirmation). */
  user: User | null;
  session: Session | null;
  inviteOrgId?: number;
}
