export type OrganizationRoleOptions = "owner" | "admin" | "member";

export interface IOrganizationUser {
  id: number
  name: string
  email: string
  role: OrganizationRoleOptions
}
