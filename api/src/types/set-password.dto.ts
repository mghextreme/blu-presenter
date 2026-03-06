import { IsNotEmpty, MinLength } from 'class-validator';

export class SetPasswordDto {
  @IsNotEmpty()
  @MinLength(8)
  newPassword: string;
}
