/* eslint-disable @typescript-eslint/no-explicit-any */
import { IOrganization } from "@/types/organization.interface";
import { ApiService } from "./api.service";

export class OrganizationsService extends ApiService {

  public async getById(orgId: number): Promise<IOrganization | null> {
    return await this.getOrFetch({
      queryKey: ['organizations', 'id', orgId],
      queryFn: async () => {
        const response = await this.getRequest(`/organizations/${orgId}`);
        return this.parseOrganization(response);
      },
    });
  }

  public async add(value: IOrganization): Promise<IOrganization | null> {
    return await this.postRequest('/organizations', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as IOrganization;
  }

  public async update(id: number, value: IOrganization): Promise<IOrganization | null> {
    return await this.putRequest(`/organizations/${id}`, JSON.stringify(value), {
      'content-type': 'application/json',
    }) as IOrganization;
  }

  private parseOrganization(response: any): IOrganization {
    return {
      id: response.id,
      name: response?.name,
      owner: {
        id: response.owner.id,
        name: response.owner?.name,
      },
      users: response.users.map((user: any) => ({
        id: user.user.id,
        name: user.user?.name,
        email: user.user?.email,
        role: user.role,
      })),
    } as IOrganization;
  }

}
