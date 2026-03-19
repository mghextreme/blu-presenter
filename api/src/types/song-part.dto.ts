export class SongPartLineDto {
  type: 'lyrics' | 'chords' | 'comments';
  content: string;
}

export class SongPartDto {
  name?: string;
  acronym?: string;
  lines: SongPartLineDto[];
}
