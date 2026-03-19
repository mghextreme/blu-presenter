export type SongPartLineType = 'lyrics' | 'chords' | 'comments'

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
