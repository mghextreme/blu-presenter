import { IOrganizationInvitation } from "./organization-invitation.interface"
import { IOrganizationUser, OrganizationRoleOptions } from "./organization-user.interface"

export interface IOrganization {
  id: number
  name?: string
  owner?: IOrganizationUser
  users?: IOrganizationUser[]
  invitations?: IOrganizationInvitation[]
  role?: OrganizationRoleOptions
}
