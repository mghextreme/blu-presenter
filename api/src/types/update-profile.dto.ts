import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class UpdateProfileDto {
  @IsNotEmpty()
  @Length(2, 40)
  nickname: string;

  @IsOptional()
  @Length(2, 511)
  name?: string;
}
