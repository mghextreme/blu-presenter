import { IOrganizationUser } from "./organization-user.interface"

export interface IOrganization {
  id: number
  name?: string
  owner?: IOrganizationUser
  users?: IOrganizationUser[]
}
