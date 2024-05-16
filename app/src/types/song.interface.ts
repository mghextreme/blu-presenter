import { ISongPart } from "./song-part.interface";

export interface ISong {
  id: number
  title: string
  artist?: string
  blocks?: ISongPart[]
}
