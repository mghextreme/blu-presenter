import { IsIn, IsObject, IsOptional, IsString } from 'class-validator';
import { AuthInvitationDataDto } from './auth-invitation-data.dto';

export type SupportedLocale = 'en' | 'pt';
export const SUPPORTED_LOCALES: SupportedLocale[] = ['en', 'pt'];

export class AuthDto {
  @IsOptional()
  @IsObject()
  invite?: AuthInvitationDataDto;

  /**
   * Preferred UI language of the caller. Used to localize transactional emails
   * (password reset, OTP sign-in). Persisted to the Supabase user's
   * `user_metadata.locale` so subsequent server-side email templating can read
   * it via `{{ .Data.locale }}`.
   */
  @IsOptional()
  @IsString()
  @IsIn(SUPPORTED_LOCALES)
  locale?: SupportedLocale;
}
