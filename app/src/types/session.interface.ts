import { IControllerSelection } from "./controller-selection.interface"
import { ISortableScheduleItem } from "./schedule-item.interface"
import { SupportedUILanguage } from "./supported-language"

export interface ISession {
  id: number
  name: string
  secret?: string

  language?: SupportedUILanguage | null
  theme?: string | null
  default?: boolean

  organization?: {
    id: number
    name: string
  }

  schedule?: ISortableScheduleItem[]
  scheduleItem?: ISortableScheduleItem
  selection?: IControllerSelection
}
