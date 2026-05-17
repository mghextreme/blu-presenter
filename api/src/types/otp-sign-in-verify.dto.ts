import { IsEmail, IsNotEmpty, IsOptional, IsString, Length } from 'class-validator';
import { AuthDto } from './auth.dto';

export class OtpSignInVerifyDto extends AuthDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 10)
  token: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
