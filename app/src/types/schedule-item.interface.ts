import { ISlide } from "./slide.interface"

export interface IScheduleItem {
  title?: string

  slides: ISlide[]
}
