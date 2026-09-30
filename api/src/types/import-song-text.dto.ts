import { IsNotEmpty, IsString } from 'class-validator';

export class ImportSongTextDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}
