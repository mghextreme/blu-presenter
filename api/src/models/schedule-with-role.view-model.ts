import { OrganizationRoleOptions } from 'src/types';

export interface ScheduleWithRoleViewModel {
  id: number;
  title: string;
  date: string | null;
  secret: string;
  createdBy: number;
  createdAt: Date;
  updatedAt: Date;
  organization: {
    id: number;
    name: string;
    role?: OrganizationRoleOptions;
  };
}
