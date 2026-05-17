import { IsNotEmpty, MinLength } from 'class-validator';

export class ResetPasswordDto {
  @IsNotEmpty()
  accessToken: string;

  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
