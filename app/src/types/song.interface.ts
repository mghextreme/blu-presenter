import { ISongPart } from "./song-part.interface";

export interface ISong {
  id: number
  language?: 'en' | 'pt' | 'es' | 'fr' | 'de' | 'it';
  title: string
  artist?: string
  blocks?: ISongPart[]
}
