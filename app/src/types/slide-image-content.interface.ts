import { ISlideContent } from "./slide-content.interface";

export interface ISlideImageContent extends ISlideContent {
  url: string
  width: number
  height: number

  alt?: string
}
