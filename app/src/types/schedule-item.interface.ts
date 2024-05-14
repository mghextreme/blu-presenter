import { ISlide } from "./slide.interface"

export interface IScheduleItem {
  id: string
  index?: number
  title?: string

  slides: ISlide[]
}
