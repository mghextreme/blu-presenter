import { Session, User } from "@supabase/supabase-js";

export type SupportedLocale = "en" | "pt";

export interface IAuthInvitationData {
  id: number;
  secret: string;
}

export interface ISignInData {
  email: string;
  password: string;
  invite?: IAuthInvitationData;
  captchaToken?: string;
  locale?: SupportedLocale;
}

export interface ISignUpData {
  email: string;
  password: string;
  invite?: IAuthInvitationData;
  captchaToken?: string;
  locale?: SupportedLocale;
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

export interface IUserIdentity {
  identityId: string;
  provider: string;
  email?: string;
  createdAt?: string;
}

export interface IUserIdentitiesResponse {
  identities: IUserIdentity[];
  hasPassword: boolean;
}

export interface ISetPasswordData {
  newPassword: string;
}

export interface IForgotPasswordData {
  email: string;
  captchaToken?: string;
  locale?: SupportedLocale;
}

export interface IResetPasswordData {
  accessToken: string;
  newPassword: string;
}

export interface IOtpSignInRequestData {
  email: string;
  invite?: IAuthInvitationData;
  captchaToken?: string;
  locale?: SupportedLocale;
}

export interface IOtpSignInVerifyData {
  email: string;
  token: string;
  invite?: IAuthInvitationData;
  locale?: SupportedLocale;
}

