import { IsObject, IsOptional } from 'class-validator';
import { AuthInvitationDataDto } from './auth-invitation-data.dto';

export class AuthDto {
  @IsOptional()
  @IsObject()
  invite?: AuthInvitationDataDto;
}
