import { ISlideContent } from "./slide-content.interface"

export interface ISlide {
  id?: string

  content?: ISlideContent[]
  background?: any
}
