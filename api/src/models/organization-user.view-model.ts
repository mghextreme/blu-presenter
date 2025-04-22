export interface OrganizationUserViewModel {
  id: number;
  name: string;
  role: 'owner' | 'admin' | 'member';
}
