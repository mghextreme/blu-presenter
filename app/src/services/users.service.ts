import { FetchQueryOptions } from "@tanstack/react-query";
import { ApiService } from "./api.service";
import { IProfile } from "@/types"
import { IOrganization } from "@/types/organization.interface";

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
  
  public async getOrganizations(): Promise<IOrganization[]> {
    return await this.getOrFetch(this.getOrganizationsQuery());
  }

  public getOrganizationsQuery(): FetchQueryOptions<IOrganization[]> {
    return {
      queryKey: ['organizations'],
      queryFn: async () => await this.getRequest(`/users/organizations`) as IOrganization[],
    };
  }

}
