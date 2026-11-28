import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  Length,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SongPartDto } from './song-part.dto';
import { SongReferenceDto } from './song-reference.dto';

export class UpdateSongDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  @IsOptional()
  @IsString()
  artist?: string;

  @IsOptional()
  @Length(2, 2)
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
