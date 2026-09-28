import { OrganizationRoleOptions } from 'src/types';

export interface SessionWithRoleViewModel {
  id: number;
  name: string;
  language: string;
  theme: string;
  default: boolean;
  secret: string;
  organization: {
    id: number;
    name: string;
    role?: OrganizationRoleOptions;
  };
}
