import { IsNotEmpty, Min } from 'class-validator';

export class AuthInvitationDataDto {
  @IsNotEmpty()
  @Min(1)
  id: number;

  @IsNotEmpty()
  secret: string;
}
