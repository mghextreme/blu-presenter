import { IsNotEmpty, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsNotEmpty()
  @Length(2, 40)
  nickname: string;

  @Length(2, 511)
  name?: string;
}
