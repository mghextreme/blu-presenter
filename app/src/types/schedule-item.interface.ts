import { ISlide } from "./slide.interface"

export interface IScheduleItem {
  id: number
  index?: number
  title?: string

  slides: ISlide[]
}
