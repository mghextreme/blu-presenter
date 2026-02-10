import { IsArray, IsInt, IsNotEmpty, IsObject, IsOptional, IsString, Length, Min } from 'class-validator';
import { SongPartDto } from './song-part.dto';
import { SongReference } from 'src/entities';

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
  blocks: SongPartDto[];

  @IsOptional()
  @IsArray()
  @IsObject({ each: true })
  references?: SongReference[];
}
