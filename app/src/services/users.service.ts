import { FetchQueryOptions } from "@tanstack/react-query";
import { ApiService } from "./api.service";
import { IProfile } from "@/types"

export class UsersService extends ApiService {

  public async getProfile(): Promise<IProfile | null> {
    return await this.getOrFetch(this.getProfileQuery());
  }

  public getProfileQuery(): FetchQueryOptions<IProfile> {
    return {
      queryKey: ['profile'],
      queryFn: async () => await this.getRequest(`/users/profile`) as IProfile,
    };
  }

  public async update(value: IProfile): Promise<IProfile | null> {
    return await this.putRequest(`/users/profile`, JSON.stringify(value), {
      'content-type': 'application/json',
    }) as IProfile;
  }

}
