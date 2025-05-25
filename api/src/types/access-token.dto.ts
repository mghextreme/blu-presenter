import { Session, User } from '@supabase/supabase-js';

export class AccessTokenDto {
  user: User;
  session: Session;
  inviteOrgId?: number;
}
