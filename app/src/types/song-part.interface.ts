export interface ISongPart {
  id?: number
  text?: string
  chords?: string
}

export interface INumberedSongPart extends ISongPart {
  sequence: number
  isFirstAppearance?: boolean
}
