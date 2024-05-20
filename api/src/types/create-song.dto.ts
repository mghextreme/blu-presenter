import { SongPartDto } from './song-part.dto';

export class CreateSongDto {
  title: string;
  artist?: string;
  blocks: SongPartDto[];
}
