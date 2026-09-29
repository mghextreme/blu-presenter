import {
  Organization,
  OrganizationInvitation,
  OrganizationUser,
  User,
} from 'src/entities';
import { OrganizationRoleOptions } from './organization-role.type';
import { OrganizationFeature } from './organization-feature.type';

export class OrganizationViewModel {
  id: number;
  name: string | null;
  owner: User;
  users?: OrganizationUser[];
  invitations?: OrganizationInvitation[];
  role: OrganizationRoleOptions;
  disabledFeatures: OrganizationFeature[];

  constructor(org: Organization, role: OrganizationRoleOptions) {
    this.id = org.id;
    this.name = org.name;
    this.owner = org.owner;
    this.users = org.users;
    this.invitations = org.invitations;
    this.role = role;
    this.disabledFeatures = org.disabledFeatures ?? [];
  }
}
