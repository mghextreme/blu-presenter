import { ISlideContent } from "./slide-content.interface"

export interface ISlide {
  id?: string
  index?: number

  content?: ISlideContent[]
  background?: any
}
