import { Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export const SONG_PART_LINE_TYPES = ['lyrics', 'chords', 'comments'] as const;

export class SongPartLineDto {
  @IsIn(SONG_PART_LINE_TYPES)
  type: (typeof SONG_PART_LINE_TYPES)[number];

  @IsString()
  content: string;
}

export class SongPartDto {
  /** Position assigned by the editor; stored as sent. */
  @IsOptional()
  @IsInt()
  id?: number;

  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  acronym?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SongPartLineDto)
  lines: SongPartLineDto[];
}
