import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { AuthDto } from './auth.dto';

export class ForgotPasswordDto extends AuthDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  captchaToken?: string;
}
