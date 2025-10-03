import { IsNotEmpty, Length } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @Length(2, 2)
  language?: string;

  @Length(2, 16)
  theme?: string;
}
