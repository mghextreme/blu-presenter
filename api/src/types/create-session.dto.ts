import { IsNotEmpty, IsOptional, Length } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @IsOptional()
  @Length(2, 2)
  language?: string;

  @IsOptional()
  @Length(2, 16)
  theme?: string;
}
