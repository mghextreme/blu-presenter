/* eslint-disable @typescript-eslint/no-explicit-any */
import { IOrganization } from "@/types/organization.interface";
import { ApiService } from "./api.service";
import { IOrganizationInvitation, OrganizationRoleOptions } from "@/types";

export class OrganizationsService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['organizations'] });
  }

  public async getCurrent(): Promise<IOrganization | null> {
    return await this.getOrFetch({
      queryKey: ['organizations', 'self'],
      queryFn: async () => {
        const response = await this.getRequest('/organizations/self');
        return this.parseOrganization(response);
      },
    });
  }

  public async add(value: IOrganization): Promise<IOrganization | null> {
    const result = await this.postRequest('/organizations', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as IOrganization;

    this.clearCache();

    return result;
  }

  public async update(value: IOrganization): Promise<IOrganization | null> {
    const result = await this.putRequest('/organizations/self', JSON.stringify(value), {
      'content-type': 'application/json',
    }) as IOrganization;

    this.clearCache();

    return result;
  }

  public async delete(): Promise<void> {
    await this.deleteRequest(`/organizations`, {
      'content-type': 'application/json',
    });

    this.clearCache();
  }

  public async inviteMember(email: string, role: OrganizationRoleOptions): Promise<IOrganizationInvitation> {
    const result = await this.postRequest('/organizations/members', JSON.stringify({
      email,
      role,
    }), {
      'content-type': 'application/json',
    }) as IOrganizationInvitation;

    this.clearCache();

    return result;
  }

  public async cancelInvitation(id: number): Promise<void> {
    await this.deleteRequest(`/organizations/invitations/${id}`, {
      'content-type': 'application/json',
    });

    this.clearCache();
  }

  public async removeMember(id: number): Promise<void> {
    await this.deleteRequest(`/organizations/members/${id}`, {
      'content-type': 'application/json',
    });

    this.clearCache();
  }

  private parseOrganization(response: any): IOrganization {
    return {
      id: response.id,
      name: response?.name,
      role: response?.role,
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
      invitations: response?.invitations,
    } as IOrganization;
  }

}
