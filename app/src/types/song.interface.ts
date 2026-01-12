import { ISongPart } from "./song-part.interface";
import { ISongReference } from "./song-reference.interface";
import { SupportedLanguage } from "./supported-language.type";

export interface ISong {
  id: number
  language?: SupportedLanguage;
  title: string
  artist?: string
  blocks?: ISongPart[]
  references?: ISongReference[]
  secret?: string
}
