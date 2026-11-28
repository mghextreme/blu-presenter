import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
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
  @ValidateNested({ each: true })
  @Type(() => SongPartDto)
  blocks: SongPartDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SongReferenceDto)
  references?: SongReferenceDto[];
}
