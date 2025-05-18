import { FetchQueryOptions } from "@tanstack/react-query";
import { ApiService } from "./api.service";
import { IProfile, UserOrganization } from "@/types"

export class UsersService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['user'] });
  }

  public async getProfile(): Promise<IProfile | null> {
    return await this.getOrFetch(this.getProfileQuery());
  }

  public getProfileQuery(): FetchQueryOptions<IProfile> {
    return {
      queryKey: ['user', 'profile'],
      queryFn: async () => await this.getRequest(`/users/profile`) as IProfile,
    };
  }

  public async update(value: IProfile): Promise<IProfile | null> {
    return await this.putRequest(`/users/profile`, JSON.stringify(value), {
      'content-type': 'application/json',
    }) as IProfile;
  }

  public async getUserOrganizations(): Promise<UserOrganization[]> {
    return await this.getOrFetch(this.getOrganizationsQuery());
  }

  public getOrganizationsQuery(): FetchQueryOptions<UserOrganization[]> {
    return {
      queryKey: ['user', 'organizations'],
      queryFn: async () => {
        const orgUsers = await this.getRequest(`/users/organizations`);
        return orgUsers.map((x: {
          id: number,
          role: "owner" | "admin" | "member",
          name?: string,
        }) => new UserOrganization(x.id, x.role, x.name));
      },
    };
  }

}
