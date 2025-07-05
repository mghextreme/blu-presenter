import { ISongPart } from "./song-part.interface";
import { SupportedLanguage } from "./supported-language";

export interface ISong {
  id: number
  language?: SupportedLanguage;
  title: string
  artist?: string
  blocks?: ISongPart[]
}
