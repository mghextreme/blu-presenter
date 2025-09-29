export interface ISession {
  id: number
  name: string
  secret?: string
  organization?: {
    id: number
    name: string
  }
}
