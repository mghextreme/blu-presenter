import { OrganizationRoleOptions } from 'src/types';

export interface ThemeWithRoleViewModel {
  id: number;
  name: string;
  extends: 'lyrics' | 'subtitles' | 'teleprompter';
  config: any;
  organization: {
    id: number;
    name: string;
    role?: OrganizationRoleOptions;
  };
}
