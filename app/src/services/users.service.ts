import { queryOptions } from '@tanstack/react-query';
import { ApiService } from './api.service';
import { IProfile } from '@/types';

export class UsersService extends ApiService {
  public async getProfile(): Promise<IProfile | null> {
    return await this.queryClient.query(this.getProfileQuery());
  }

  public getProfileQuery() {
    return queryOptions({
      queryKey: ['user', 'profile'],
      queryFn: async () => (await this.getRequest(`/users/profile`)) as IProfile,
    });
  }

  public async update(value: IProfile): Promise<IProfile | null> {
    const profile = (await this.putRequest(`/users/profile`, JSON.stringify(value), {
      'content-type': 'application/json',
    })) as IProfile;
    void this.queryClient.invalidateQueries({ queryKey: ['user', 'profile'] });
    return profile;
  }
}
