import { ISlide } from "./slide.interface"

export interface IScheduleItem {
  id: string
  title?: string

  slides: ISlide[]
}
