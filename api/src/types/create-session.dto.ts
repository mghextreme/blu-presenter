import { IsNotEmpty, Length } from 'class-validator';

export class CreateSessionDto {
  @IsNotEmpty()
  @Length(2, 255)
  name: string;
}
