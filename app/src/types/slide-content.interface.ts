import { SlideContentType } from "./slide-content-type.type"

export interface ISlideContent {
  id?: string
  index?: number
  type: SlideContentType
}
