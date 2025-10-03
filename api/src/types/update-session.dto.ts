import { IsInt, IsNotEmpty, Length, Min } from 'class-validator';

export class UpdateSessionDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsNotEmpty()
  @Length(2, 255)
  name: string;

  @Length(2, 2)
  language?: string;

  @Length(2, 16)
  theme?: string;
}
