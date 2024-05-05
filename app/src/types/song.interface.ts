import { ISongPart } from "./song-part.interface";

export interface ISong {
  title: string
  artist?: string
  blocks?: ISongPart[]
}
