import { IsEmail, IsNotEmpty, MinLength } from 'class-validator';
import { AuthInvitationDataDto } from './auth-invitation-data.dto';

export class SignUpDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsNotEmpty()
  @MinLength(8)
  password: string;

  invite?: AuthInvitationDataDto;
}
