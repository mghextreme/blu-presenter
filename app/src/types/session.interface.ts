import { IControllerSelection } from "./controller-selection.interface"
import { ISortableScheduleItem } from "./schedule-item.interface"
import { SupportedUILanguage } from "./supported-language.type"
import { OrganizationRoleOptions } from "./organization-user.interface"

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
    role?: OrganizationRoleOptions
  }

  schedule?: ISortableScheduleItem[]
  scheduleItem?: ISortableScheduleItem
  selection?: IControllerSelection
}
