import { IsIn, IsNotEmpty, Length } from 'class-validator';
import { SongPartDto } from './song-part.dto';
import { SupportedLanguages } from './supported-languages';
import { SongReferenceDto } from './song-reference.dto';

export class CreateSongDto {
  @IsNotEmpty()
  @Length(2, 255)
  title: string;

  artist?: string;

  @IsIn(SupportedLanguages)
  language?: string;

  blocks: SongPartDto[];

  references?: SongReferenceDto[];
}
