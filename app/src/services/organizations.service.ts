/* eslint-disable @typescript-eslint/no-explicit-any */
import { IOrganization } from "@/types/organization.interface";
import { ApiService } from "./api.service";
import { IOrganizationInvitation, OrganizationRoleOptions, UserOrganization } from "@/types";
import { useAuth } from "@/hooks/useAuth";
import { FetchQueryOptions } from "@tanstack/react-query";

export class OrganizationsService extends ApiService {

  public clearCache(): void {
    this.queryClient.removeQueries({ queryKey: ['organizations'] });
    this.queryClient.removeQueries({ queryKey: ['user', 'organizations'] });
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

    useAuth.getState().organization?.id;

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

  public async getInvitations(): Promise<IOrganizationInvitation[]> {
    return await this.getOrFetch({
      queryKey: ['organizations', 'invitations', 'self'],
      queryFn: async () => {
        return await this.getRequest('/organizations/invitations');
      },
    });
  }

  public async acceptInvitation(id: number): Promise<void> {
    await this.postRequest(`/organizations/invitations/${id}/accept`, undefined, {
      'content-type': 'application/json',
    });

    this.clearCache();
  }

  public async rejectInvitation(id: number): Promise<void> {
    await this.postRequest(`/organizations/invitations/${id}/reject`, undefined, {
      'content-type': 'application/json',
    });

    this.clearCache();
  }

  public async cancelInvitation(id: number): Promise<void> {
    await this.deleteRequest(`/organizations/invitations/${id}`, {
      'content-type': 'application/json',
    });

    this.clearCache();
  }

  public async leave() {
    await this.postRequest(`/organizations/leave`, undefined, {
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

  public async getFromUser(): Promise<UserOrganization[]> {
    return await this.getOrFetch(this.getFromUserQuery());
  }

  public getFromUserQuery(): FetchQueryOptions<UserOrganization[]> {
    return {
      queryKey: ['user', 'organizations'],
      queryFn: async () => {
        const orgUsers = await this.getRequest(`/users/organizations`);
        const mappedOrgs = orgUsers.map((x: {
          id: number,
          role: "owner" | "admin" | "member",
          name?: string,
        }) => new UserOrganization(x.id, x.role, x.name));

        useAuth.setState({
          organizations: mappedOrgs,
        });
        useAuth.getState().setOrganizationById(null);

        return mappedOrgs;
      },
    };
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
      users: response.users?.map((user: any) => ({
        id: user.user.id,
        name: user.user?.name,
        email: user.user?.email,
        role: user.role,
      })) || [],
      invitations: response?.invitations,
    } as IOrganization;
  }

}
