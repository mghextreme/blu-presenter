import { IsInt, IsNotEmpty, Length, Min } from 'class-validator';
import { SongPartDto } from './song-part.dto';

export class UpdateSongDto {
  @IsInt()
  @Min(1)
  id: number;

  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  artist?: string;

  @Length(2, 2)
  language?: string;

  blocks: SongPartDto[];
}
