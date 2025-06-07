import { IsNotEmpty, Length } from 'class-validator';
import { SongPartDto } from './song-part.dto';

export class CreateSongDto {
  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  artist?: string;

  @Length(2, 2)
  language?: string;

  blocks: SongPartDto[];
}
