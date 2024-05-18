import { SongPartDto } from './song-part.dto';

export class UpdateSongDto {
  id: number;
  title: string;
  artist?: string;
  blocks: SongPartDto[];
}
