import { IsArray, IsIn, IsNotEmpty, IsObject, IsOptional, IsString, Length } from 'class-validator';
import { SongPartDto } from './song-part.dto';
import { SupportedLanguages } from './supported-languages';
import { SongReferenceDto } from './song-reference.dto';

export class CreateSongDto {
  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @IsIn(SupportedLanguages)
  language?: string;

  @IsArray()
  @IsObject({ each: true })
  blocks: SongPartDto[];

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  references?: SongReferenceDto[];
}
