import { Session, User } from "@supabase/supabase-js";

export interface IAuthInvitationData {
  id: number;
  secret: string;
}

export interface ISignInData {
  email: string;
  password: string;
  invite?: IAuthInvitationData;
}

export interface ISignUpData {
  email: string;
  password: string;
  invite?: IAuthInvitationData;
}

export interface IRefreshSessionData {
  refreshToken: string;
}

export interface IChangePasswordData {
  currentPassword: string;
  newPassword: string;
}

export interface IAuthResponse {
  user: User;
  session: Session;
  inviteOrgId?: number;
}

export interface IOAuthRedirect {
  url: string;
  codeVerifier: string;
}

export interface IExchangeCodeData {
  code: string;
  codeVerifier: string;
  invite?: IAuthInvitationData;
}
