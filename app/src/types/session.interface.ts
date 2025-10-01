import { IControllerSelection } from "./controller-selection.interface"
import { ISortableScheduleItem } from "./schedule-item.interface"

export interface ISession {
  id: number
  name: string
  secret?: string

  language?: string
  theme?: string
  default?: boolean

  organization?: {
    id: number
    name: string
  }

  schedule?: ISortableScheduleItem[]
  scheduleItem?: ISortableScheduleItem
  selection?: IControllerSelection
}
