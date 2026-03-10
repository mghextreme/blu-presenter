export interface IScheduleItem {
  id: number
  index?: number
  title?: string
  type?: string
  artist?: string
  language?: string
  blocks?: any[]
  references?: any[]
  slides?: any[]
  secret?: string
  uniqueId?: number
  updatedAt?: Date
}
