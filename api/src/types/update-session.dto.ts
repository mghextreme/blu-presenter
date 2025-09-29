import { IsInt, IsNotEmpty, Length, Min } from 'class-validator';

export class UpdateSessionDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsNotEmpty()
  @Length(2, 255)
  name: string;
}
