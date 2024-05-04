import { ISlideContent } from "./slide-content.interface";

export interface ISlideTitleContent extends ISlideContent {
  title: string
  subtitle?: string
}
