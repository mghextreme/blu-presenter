export class SongPartLine {
  type: 'lyrics' | 'chords' | 'comments';
  content: string;
}

export class SongPart {
  name?: string;
  acronym?: string;
  lines: SongPartLine[];
}
