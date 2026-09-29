import { OrganizationRoleOptions } from "./organization-user.interface";
import { OrganizationFeature } from "./organization-feature.type";

export class UserOrganization {
  id: number
  role: OrganizationRoleOptions

  name?: string
  disabledFeatures?: OrganizationFeature[]

  constructor(
    id: number,
    role: OrganizationRoleOptions,
    name?: string,
    disabledFeatures?: OrganizationFeature[]
  ) {
    this.id = id;
    this.role = role;
    this.name = name;
    this.disabledFeatures = disabledFeatures;
  }

  public isOwner(): boolean {
    return this.role === "owner";
  }
}
