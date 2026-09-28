import { IOrganizationInvitation } from "./organization-invitation.interface"
import { IOrganizationUser, OrganizationRoleOptions } from "./organization-user.interface"
import { OrganizationFeature } from "./organization-feature.type"

export interface IOrganization {
  id: number
  name?: string
  owner?: IOrganizationUser
  users?: IOrganizationUser[]
  invitations?: IOrganizationInvitation[]
  role?: OrganizationRoleOptions
  disabledFeatures?: OrganizationFeature[]
}
