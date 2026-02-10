import { IsObject } from 'class-validator';
import { AuthInvitationDataDto } from './auth-invitation-data.dto';

export class AuthDto {
  @IsObject()
  invite?: AuthInvitationDataDto;
}
