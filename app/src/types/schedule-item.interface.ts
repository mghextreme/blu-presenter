import { ScheduleItemType } from "./schedule-item.type"
import { ISlide } from "./slide.interface"

export interface IScheduleItem {
  id: number
  index?: number
  title?: string
  type: ScheduleItemType

  slides: ISlide[]
}
