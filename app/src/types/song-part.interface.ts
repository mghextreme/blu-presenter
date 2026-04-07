export const SONG_PART_LINE_TYPES = ['lyrics', 'chords', 'comments'] as const;
export type SongPartLineType = typeof SONG_PART_LINE_TYPES[number];

export type SongEditMode = 'lyrics' | 'chords';

export interface ISongPartLine {
  type: SongPartLineType
  content: string
}

export interface ISongPart {
  id?: number
  name?: string
  acronym?: string
  lines: ISongPartLine[]
}

export interface INumberedSongPart extends ISongPart {
  sequence: number
  isFirstAppearance?: boolean
}
