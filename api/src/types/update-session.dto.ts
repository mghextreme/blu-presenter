import { IsInt, IsNotEmpty, IsOptional, Length, Min } from 'class-validator';

export class UpdateSessionDto {
  @IsInt()
  @Min(1)
  id: number;

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
