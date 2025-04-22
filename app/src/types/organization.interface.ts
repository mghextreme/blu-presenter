import { IOrganizationUser } from "./organization-user.interface"

export interface IOrganization {
  id: number
  name?: string
  members: IOrganizationUser[]
}
