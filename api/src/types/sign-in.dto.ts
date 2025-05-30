import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { AuthDto } from './auth.dto';

export class SignInDto extends AuthDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;
}
