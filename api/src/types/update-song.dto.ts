import { IsArray, IsInt, IsNotEmpty, IsObject, IsString, Length, Min } from 'class-validator';
import { SongPartDto } from './song-part.dto';
import { SongReference } from 'src/entities';

export class UpdateSongDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  @IsString()
  artist?: string;

  @Length(2, 2)
  language?: string;

  @IsArray()
  @IsObject({ each: true })
  blocks: SongPartDto[];

  @IsArray()
  @IsObject({ each: true })
  references?: SongReference[];
}
