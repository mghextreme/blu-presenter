export interface IOrganizationUser {
  id: number
  name: string
  email: string
  role: "owner" | "admin" | "member"
}
