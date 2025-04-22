import { IOrganization } from "@/types/organization.interface";
import { ApiService } from "./api.service";

export class OrganizationsService extends ApiService {

  public async getById(orgId: number): Promise<IOrganization | null> {
    return await this.getOrFetch({
      queryKey: ['organizations', 'id', orgId],
      queryFn: async () => await this.getRequest(`/organizations/${orgId}`) as IOrganization,
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

}
