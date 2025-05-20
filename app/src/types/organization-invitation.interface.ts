import { IOrganizationUser, OrganizationRoleOptions } from "./organization-user.interface"

export interface IOrganizationInvitation {
  id: number
  orgId: number
  email: string
  role: OrganizationRoleOptions
  secret: string
  inviter: IOrganizationUser
}
