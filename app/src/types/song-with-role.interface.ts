import { OrganizationRoleOptions } from "./organization-user.interface";
import { ISong } from "./song.interface";

export interface ISongWithRole extends ISong {
  organization?: {
    id: number;
    name: string;
    role: OrganizationRoleOptions;
  };
}
