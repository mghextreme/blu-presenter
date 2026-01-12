import { OrganizationRoleOptions } from "./organization-user.interface";

export class UserOrganization {
  id: number
  role: OrganizationRoleOptions

  name?: string

  constructor(id: number, role: OrganizationRoleOptions, name?: string) {
    this.id = id;
    this.role = role;
    this.name = name;
  }

  public isOwner(): boolean {
    return this.role === "owner";
  }
}
